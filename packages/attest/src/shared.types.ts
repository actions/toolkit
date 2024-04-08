import type {SerializedBundle} from '@sigstore/bundle'

/*
 * The subject of an attestation.
 */
export type Subject = {
  /*
   * Name of the subject.
   */
  name: string
  /*
   * Digests of the subject. Should be a map of digest algorithms to their hex-encoded values.
   */
  digest: Record<string, string>
}

/*
 * The predicate of an attestation.
 */
export type Predicate = {
  /*
   * URI identifying the content type of the predicate.
   */
  type: string
  /*
   * Predicate parameters.
   */
  params: object
}

/*
 * Artifact attestation.
 */
export type Attestation = {
  /*
   * Serialized Sigstore bundle containing the provenance attestation,
   * signature, signing certificate and witnessed timestamp.
   */
  bundle: SerializedBundle
  /*
   * PEM-encoded signing certificate used to sign the attestation.
   */
  certificate: string
  /*
   * ID of Rekor transparency log entry created for the attestation.
   */
  tlogID?: string
  /*
   * ID of the persisted attestation (accessible via the GH API).
   */
  attestationID?: string
}
