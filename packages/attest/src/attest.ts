import {bundleToJSON} from '@sigstore/bundle'
import {X509Certificate} from 'crypto'
import {SigstoreInstance, signingEndpoints} from './endpoints'
import {buildIntotoStatement} from './intoto'
import {Payload, signPayload} from './sign'
import {writeAttestation} from './store'

import type {Bundle} from '@sigstore/sign'
import type {Attestation, Predicate, Subject} from './shared.types'

const INTOTO_PAYLOAD_TYPE = 'application/vnd.in-toto+json'

/**
 * Options for attesting a subject / predicate.
 */
export type AttestOptions = {
  /**
   * @deprecated Use `subjects` instead.
   **/
  subjectName?: string
  /**
   * @deprecated Use `subjects` instead.
   **/
  subjectDigest?: Record<string, string>
  // Subjects to be attested.
  subjects?: Subject[]
  // Content type of the predicate being attested.
  predicateType: string
  // Predicate to be attested.
  predicate: object
  // GitHub token for writing attestations.
  token: string
  // Sigstore instance to use for signing. Must be one of "public-good" or
  // "github".
  sigstore?: SigstoreInstance
  // HTTP headers to include in request to attestations API.
  headers?: {[header: string]: string | number | undefined}
  // Whether to skip writing the attestation to the GH attestations API.
  skipWrite?: boolean
}

/**
 * Generates an attestation for the given subject and predicate. The subject and
 * predicate are combined into an in-toto statement, which is then signed using
 * the identified Sigstore instance and stored as an attestation.
 * @param options - The options for attestation.
 * @returns A promise that resolves to the attestation.
 */
export async function attest(options: AttestOptions): Promise<Attestation> {
  let subjects: Subject[]

  if (options.subjects) {
    subjects = options.subjects
  } else if (options.subjectName && options.subjectDigest) {
    subjects = [{name: options.subjectName, digest: options.subjectDigest}]
  } else {
    throw new Error(
      'Must provide either subjectName and subjectDigest or subjects'
    )
  }

  const predicate: Predicate = {
    type: options.predicateType,
    params: options.predicate
  }

  const statement = buildIntotoStatement(subjects, predicate)

  // Sign the provenance statement
  const payload: Payload = {
    body: Buffer.from(JSON.stringify(statement)),
    type: INTOTO_PAYLOAD_TYPE
  }
  const endpoints = signingEndpoints(options.sigstore)
  const bundle = await signPayload(payload, endpoints)

  // Store the attestation
  let attestationID: string | undefined
  if (options.skipWrite !== true) {
    attestationID = await writeAttestation(
      bundleToJSON(bundle),
      options.token,
      {headers: options.headers}
    )
  }

  return toAttestation(bundle, attestationID)
}

function toAttestation(bundle: Bundle, attestationID?: string): Attestation {
  let certBytes: Buffer
  switch (bundle.verificationMaterial.content.$case) {
    case 'x509CertificateChain':
      certBytes =
        bundle.verificationMaterial.content.x509CertificateChain.certificates[0]
          .rawBytes
      break
    case 'certificate':
      certBytes = bundle.verificationMaterial.content.certificate.rawBytes
      break
    default:
      throw new Error('Bundle must contain an x509 certificate')
  }

  // Convert Buffer to Uint8Array for Node.js 24 compatibility
  const signingCert = new X509Certificate(new Uint8Array(certBytes))

  // Collect transparency log ID if available
  const tlogEntries = bundle.verificationMaterial.tlogEntries
  const tlogID = tlogEntries.length > 0 ? tlogEntries[0].logIndex : undefined

  return {
    bundle: bundleToJSON(bundle),
    certificate: signingCert.toString(),
    tlogID,
    attestationID
  }
}
