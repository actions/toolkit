import {MockAgent, setGlobalDispatcher} from 'undici'
import {writeAttestation} from '../src/store'

describe('writeAttestation', () => {
  const originalEnv = process.env
  const attestation = {foo: 'bar '}
  const token = 'token'
  const headers = {'X-GitHub-Foo': 'true'}

  const mockAgent = new MockAgent()
  setGlobalDispatcher(mockAgent)

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GITHUB_REPOSITORY: 'foo/bar'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when the api call is successful', () => {
    beforeEach(() => {
      mockAgent
        .get('https://api.github.com')
        .intercept({
          path: '/repos/foo/bar/attestations',
          method: 'POST',
          headers: {authorization: `token ${token}`, ...headers},
          body: JSON.stringify({bundle: attestation})
        })
        .reply(201, {id: '123'})
    })

    it('persists the attestation', async () => {
      await expect(
        writeAttestation(attestation, token, {headers})
      ).resolves.toEqual('123')
    })
  })

  describe('when the api call fails', () => {
    beforeEach(() => {
      mockAgent
        .get('https://api.github.com')
        .intercept({
          path: '/repos/foo/bar/attestations',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({bundle: attestation})
        })
        .reply(500, 'oops')
    })

    it('throws an error', async () => {
      await expect(
        writeAttestation(attestation, token, {retry: 0})
      ).rejects.toThrow(/oops/)
    })
  })

  describe('when the api call fails but succeeds on retry', () => {
    beforeEach(() => {
      const pool = mockAgent.get('https://api.github.com')

      pool
        .intercept({
          path: '/repos/foo/bar/attestations',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({bundle: attestation})
        })
        .reply(500, 'oops')
        .times(1)

      pool
        .intercept({
          path: '/repos/foo/bar/attestations',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({bundle: attestation})
        })
        .reply(201, {id: '123'})
        .times(1)
    })

    it('persists the attestation', async () => {
      await expect(writeAttestation(attestation, token)).resolves.toEqual('123')
    })
  })
})
