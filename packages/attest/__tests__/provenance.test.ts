import * as github from '@actions/github'
import {mockFulcio, mockRekor, mockTSA} from '@sigstore/mock'
import nock from 'nock'
import {SIGSTORE_GITHUB, SIGSTORE_PUBLIC_GOOD} from '../src/endpoints'
import {attestProvenance, buildSLSAProvenancePredicate} from '../src/provenance'

// Dummy workflow environment
const env = {
  GITHUB_REPOSITORY: 'owner/repo',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: 'babca52ab0c93ae16539e5923cb0d7403b9a093b',
  GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/main.yml@main',
  GITHUB_SERVER_URL: 'https://github.com',
  GITHUB_EVENT_NAME: 'push',
  GITHUB_REPOSITORY_ID: 'repo-id',
  GITHUB_REPOSITORY_OWNER_ID: 'owner-id',
  GITHUB_RUN_ID: 'run-id',
  GITHUB_RUN_ATTEMPT: 'run-attempt',
  RUNNER_ENVIRONMENT: 'github-hosted'
}

describe('buildSLSAProvenancePredicate', () => {
  it('returns a provenance hydrated from env vars', () => {
    const predicate = buildSLSAProvenancePredicate(env)
    expect(predicate).toMatchSnapshot()
  })
})

describe('attestProvenance', () => {
  // Capture original environment variables so we can restore them after each
  // test
  const originalEnv = process.env

  // Subject to attest
  const subjectName = 'subjective'
  const subjectDigest = {
    sha256: '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
  }

  // Fake an OIDC token
  const oidcPayload = {sub: 'foo@bar.com', iss: ''}
  const oidcToken = `.${Buffer.from(JSON.stringify(oidcPayload)).toString(
    'base64'
  )}.}`

  const tokenURL = 'https://token.url'
  const attestationID = '1234567890'

  beforeEach(async () => {
    jest.clearAllMocks()

    nock(tokenURL)
      .get('/')
      .query({audience: 'sigstore'})
      .reply(200, {value: oidcToken})

    // Set-up GHA environment variables
    process.env = {
      ...originalEnv,
      ...env,
      ACTIONS_ID_TOKEN_REQUEST_URL: tokenURL,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token'
    }
  })

  afterEach(() => {
    // Restore the original environment
    process.env = originalEnv
  })

  describe('when using the github Sigstore instance', () => {
    const {fulcioURL, tsaServerURL} = SIGSTORE_GITHUB

    beforeEach(async () => {
      // Mock Sigstore
      await mockFulcio({baseURL: fulcioURL, strict: false})
      await mockTSA({baseURL: tsaServerURL})

      // Mock GH attestations API
      nock('https://api.github.com')
        .post(/^\/repos\/.*\/.*\/attestations$/)
        .reply(201, {id: attestationID})
    })

    describe('when the sigstore instance is explicitly set', () => {
      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName,
          subjectDigest,
          token: 'token',
          sigstore: 'github'
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeUndefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })

    describe('when the sigstore instance is inferred from the repo visibility', () => {
      const savedRepository = github.context.payload.repository

      beforeEach(() => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        github.context.payload.repository = {visibility: 'private'} as any
      })

      afterEach(() => {
        github.context.payload.repository = savedRepository
      })

      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName,
          subjectDigest,
          token: 'token'
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeUndefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })
  })

  describe('when using the public-good Sigstore instance', () => {
    const {fulcioURL, rekorURL} = SIGSTORE_PUBLIC_GOOD

    beforeEach(async () => {
      // Mock Sigstore
      await mockFulcio({baseURL: fulcioURL, strict: false})
      await mockRekor({baseURL: rekorURL})

      // Mock GH attestations API
      nock('https://api.github.com')
        .post(/^\/repos\/.*\/.*\/attestations$/)
        .reply(201, {id: attestationID})
    })

    describe('when the sigstore instance is explicitly set', () => {
      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName,
          subjectDigest,
          token: 'token',
          sigstore: 'public-good'
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeDefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })

    describe('when the sigstore instance is inferred from the repo visibility', () => {
      const savedRepository = github.context.payload.repository

      beforeEach(() => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        github.context.payload.repository = {visibility: 'public'} as any
      })

      afterEach(() => {
        github.context.payload.repository = savedRepository
      })

      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName,
          subjectDigest,
          token: 'token'
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeDefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })
  })

  describe('when skipWrite is set to true', () => {
    const {fulcioURL, rekorURL} = SIGSTORE_PUBLIC_GOOD
    beforeEach(async () => {
      // Mock Sigstore
      await mockFulcio({baseURL: fulcioURL, strict: false})
      await mockRekor({baseURL: rekorURL})
    })

    it('attests provenance', async () => {
      const attestation = await attestProvenance({
        subjectName,
        subjectDigest,
        token: 'token',
        sigstore: 'public-good',
        skipWrite: true
      })

      expect(attestation).toBeDefined()
      expect(attestation.bundle).toBeDefined()
      expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
      expect(attestation.tlogID).toBeDefined()
      expect(attestation.attestationID).toBeUndefined()
    })
  })
})
