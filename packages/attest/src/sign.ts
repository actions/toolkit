import {Bundle} from '@sigstore/bundle'
import {
  BundleBuilder,
  CIContextProvider,
  DSSEBundleBuilder,
  FulcioSigner,
  RekorWitness,
  TSAWitness,
  Witness
} from '@sigstore/sign'

const OIDC_AUDIENCE = 'sigstore'
const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 3

/**
 * The payload to be signed (body) and its media type (type).
 */
export type Payload = {
  body: Buffer
  type: string
}

/**
 * Options for signing a document.
 */
export type SignOptions = {
  /**
   * The URL of the Fulcio service.
   */
  fulcioURL: string
  /**
   * The URL of the Rekor service.
   */
  rekorURL?: string
  /**
   * The URL of the TSA (Time Stamping Authority) server.
   */
  tsaServerURL?: string
  /**
   * The timeout duration in milliseconds when communicating with Sigstore
   * services.
   */
  timeout?: number
  /**
   * The number of retry attempts.
   */
  retry?: number
}

/**
 * Signs the provided payload with a Sigstore-issued certificate and returns the
 * signature bundle.
 * @param payload Payload to be signed.
 * @param options Signing options.
 * @returns A promise that resolves to the Sigstore signature bundle.
 */
export const signPayload = async (
  payload: Payload,
  options: SignOptions
): Promise<Bundle> => {
  const artifact = {
    data: payload.body,
    type: payload.type
  }

  // Sign the artifact and build the bundle
  return initBundleBuilder(options).create(artifact)
}

// Assembles the Sigstore bundle builder with the appropriate options
const initBundleBuilder = (opts: SignOptions): BundleBuilder => {
  const identityProvider = new CIContextProvider(OIDC_AUDIENCE)
  const timeout = opts.timeout || DEFAULT_TIMEOUT
  const retry = opts.retry || DEFAULT_RETRIES
  const witnesses: Witness[] = []

  const signer = new FulcioSigner({
    identityProvider,
    fulcioBaseURL: opts.fulcioURL,
    timeout,
    retry
  })

  if (opts.rekorURL) {
    witnesses.push(
      new RekorWitness({
        rekorBaseURL: opts.rekorURL,
        entryType: 'dsse',
        timeout,
        retry
      })
    )
  }

  if (opts.tsaServerURL) {
    witnesses.push(
      new TSAWitness({
        tsaBaseURL: opts.tsaServerURL,
        timeout,
        retry
      })
    )
  }

  return new DSSEBundleBuilder({signer, witnesses})
}
