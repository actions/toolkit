import * as jose from 'jose'
import nock from 'nock'
import {getIDTokenClaims} from '../src/oidc'

describe('getIDTokenClaims', () => {
  const originalEnv = process.env
  const issuer = 'https://example.com'
  const audience = 'nobody'
  const requestToken = 'token'
  const openidConfigPath = '/.well-known/openid-configuration'
  const jwksPath = '/.well-known/jwks.json'
  const tokenPath = '/token'
  const openIDConfig = {jwks_uri: `${issuer}${jwksPath}`}

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let key: any

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      ACTIONS_ID_TOKEN_REQUEST_URL: `${issuer}${tokenPath}?`,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: requestToken
    }

    // Generate JWT signing key
    key = await jose.generateKeyPair('PS256')

    // Create JWK and JWKS
    const jwk = await jose.exportJWK(key.publicKey)
    const jwks = {keys: [jwk]}

    nock(issuer).get(openidConfigPath).reply(200, openIDConfig)
    nock(issuer).get(jwksPath).reply(200, jwks)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when ID token is valid', () => {
    const claims = {
      iss: issuer,
      aud: audience,
      ref: 'ref',
      sha: 'sha',
      repository: 'repo',
      event_name: 'push',
      job_workflow_ref: 'job_workflow_ref',
      workflow_ref: 'workflow',
      repository_id: '1',
      repository_owner_id: '1',
      runner_environment: 'github-hosted',
      run_id: '1',
      run_attempt: '1'
    }

    beforeEach(async () => {
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg: 'PS256'})
        .sign(key.privateKey)

      nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})
    })

    it('returns the ID token claims', async () => {
      const result = await getIDTokenClaims(issuer)
      expect(result).toEqual(claims)
    })
  })

  describe('when ID token is missing required claims', () => {
    const claims = {
      iss: issuer,
      aud: audience
    }

    beforeEach(async () => {
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg: 'PS256'})
        .sign(key.privateKey)

      nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})
    })

    it('throws an error', async () => {
      await expect(getIDTokenClaims(issuer)).rejects.toThrow(/missing claims/i)
    })
  })

  describe('when ID has the wrong issuer', () => {
    const claims = {foo: 'bar', iss: 'foo', aud: 'nobody'}

    beforeEach(async () => {
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg: 'PS256'})
        .sign(key.privateKey)

      nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})
    })

    it('throws an error', async () => {
      await expect(getIDTokenClaims(issuer)).rejects.toThrow(/issuer invalid/)
    })
  })

  describe('when ID has the wrong audience', () => {
    const claims = {foo: 'bar', iss: issuer, aud: 'bar'}

    beforeEach(async () => {
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg: 'PS256'})
        .sign(key.privateKey)

      nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})
    })

    it('throw an error', async () => {
      await expect(getIDTokenClaims(issuer)).rejects.toThrow(/audience invalid/)
    })
  })

  describe('when openid config cannot be retrieved', () => {
    const claims = {foo: 'bar', iss: issuer, aud: 'nobody'}

    beforeEach(async () => {
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg: 'PS256'})
        .sign(key.privateKey)

      nock(issuer).get(tokenPath).query({audience}).reply(200, {value: jwt})

      // Disable the openid config endpoint
      nock.removeInterceptor({
        proto: 'https',
        hostname: 'example.com',
        port: '443',
        method: 'GET',
        path: openidConfigPath
      })
    })

    it('throws an error', async () => {
      await expect(getIDTokenClaims(issuer)).rejects.toThrow(
        /failed to get id/i
      )
    })
  })
})
