import * as github from '@actions/github'

const PUBLIC_GOOD_ID = 'public-good'
const GITHUB_ID = 'github'

const FULCIO_PUBLIC_GOOD_URL = 'https://fulcio.sigstore.dev'
const REKOR_PUBLIC_GOOD_URL = 'https://rekor.sigstore.dev'

const FULCIO_INTERNAL_URL = 'https://fulcio.githubapp.com'
const TSA_INTERNAL_URL = 'https://timestamp.githubapp.com'

export type SigstoreInstance = typeof PUBLIC_GOOD_ID | typeof GITHUB_ID

export type Endpoints = {
  fulcioURL: string
  rekorURL?: string
  tsaServerURL?: string
}

export const SIGSTORE_PUBLIC_GOOD: Endpoints = {
  fulcioURL: FULCIO_PUBLIC_GOOD_URL,
  rekorURL: REKOR_PUBLIC_GOOD_URL
}

export const SIGSTORE_GITHUB: Endpoints = {
  fulcioURL: FULCIO_INTERNAL_URL,
  tsaServerURL: TSA_INTERNAL_URL
}

export const signingEndpoints = (sigstore?: SigstoreInstance): Endpoints => {
  let instance: SigstoreInstance

  // An explicitly set instance type takes precedence, but if not set, use the
  // repository's visibility to determine the instance type.
  if (sigstore && [PUBLIC_GOOD_ID, GITHUB_ID].includes(sigstore)) {
    instance = sigstore
  } else {
    instance =
      github.context.payload.repository?.visibility === 'public'
        ? PUBLIC_GOOD_ID
        : GITHUB_ID
  }

  switch (instance) {
    case PUBLIC_GOOD_ID:
      return SIGSTORE_PUBLIC_GOOD
    case GITHUB_ID:
      return SIGSTORE_GITHUB
  }
}
