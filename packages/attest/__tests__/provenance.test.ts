import * as github from '@actions/github'
import {mockFulcio, mockRekor, mockTSA} from '@sigstore/mock'
import * as jose from 'jose'
import nock from 'nock'
import {MockAgent, setGlobalDispatcher} from 'undici'
import {SIGSTORE_PUBLIC_GOOD, signingEndpoints} from '../src/endpoints'
import {attestProvenance, buildSLSAProvenancePredicate} from '../src/provenance'

describe('provenance functions', () => {
  const originalEnv = process.env
  const issuer = 'https://token.actions.foo.ghe.com'
  const audience = 'nobody'
  const jwksPath = '/.well-known/jwks.json'
  const tokenPath = '/token'

  // MockAgent for mocking @actions/github
  const mockAgent = new MockAgent()
  setGlobalDispatcher(mockAgent)

  const claims = {
    iss: issuer,
    aud: 'nobody',
    repository: 'owner/repo',
    ref: 'refs/heads/main',
    sha: 'babca52ab0c93ae16539e5923cb0d7403b9a093b',
    job_workflow_ref: 'owner/workflows/.github/workflows/publish.yml@main',
    workflow_ref: 'owner/repo/.github/workflows/main.yml@main',
    event_name: 'push',
    repository_id: 'repo-id',
    repository_owner_id: 'owner-id',
    run_id: 'run-id',
    run_attempt: 'run-attempt',
    runner_environment: 'github-hosted'
  }

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      ACTIONS_ID_TOKEN_REQUEST_URL: `${issuer}${tokenPath}?`,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token',
      GITHUB_SERVER_URL: 'https://foo.ghe.com',
      GITHUB_REPOSITORY: claims.repository
    }

    // Generate JWT signing key
    const key = await jose.generateKeyPair('PS256')

    // Create JWK, JWKS, and JWT
    const jwk = await jose.exportJWK(key.publicKey)
    const jwks = {keys: [jwk]}
    const jwt = await new jose.SignJWT(claims)
      .setProtectedHeader({alg: 'PS256'})
      .sign(key.privateKey)

    // Mock OpenID configuration and JWKS endpoints
    nock(issuer)
      .get('/.well-known/openid-configuration')
      .reply(200, {jwks_uri: `${issuer}${jwksPath}`})
    nock(issuer).get(jwksPath).reply(200, jwks)

    // Mock OIDC token endpoint for populating the provenance
    nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('buildSLSAProvenancePredicate', () => {
    it('returns a provenance hydrated from an OIDC token', async () => {
      const predicate = await buildSLSAProvenancePredicate()
      expect(predicate).toMatchSnapshot()
    })
  })

  describe('attestProvenance', () => {
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

    const attestationID = '1234567890'

    beforeEach(async () => {
      nock(issuer)
        .get(tokenPath)
        .query({audience: 'sigstore'})
        .reply(200, {value: oidcToken})
    })

    describe('when using the github Sigstore instance', () => {
      beforeEach(async () => {
        const {fulcioURL, tsaServerURL} = signingEndpoints('github')

        // Mock Sigstore
        await mockFulcio({baseURL: fulcioURL, strict: false})
        await mockTSA({baseURL: tsaServerURL})

        mockAgent
          .get('https://api.github.com')
          .intercept({
            path: /^\/repos\/.*\/.*\/attestations$/,
            method: 'post'
          })
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
        mockAgent
          .get('https://api.github.com')
          .intercept({
            path: /^\/repos\/.*\/.*\/attestations$/,
            method: 'post'
          })
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
})
