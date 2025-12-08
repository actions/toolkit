import {MockAgent, setGlobalDispatcher} from 'undici'
import {createStorageRecord} from '../src/artifact-metadata'

describe('createStorageRecord', () => {
  const originalEnv = process.env
  const attestation = {foo: 'bar '}
  const token = 'token'
  const headers = {'X-GitHub-Foo': 'true'}
  const artifactParams = {
    name: "my-lib",
    version: "1.0.0",
    digest: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  }
  const registryParams = {
    registryUrl: 'https://my-registry.org',
  }


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
          path: '/orgs/foo/artifacts/metadata/storage-record',
          method: 'POST',
          headers: {authorization: `token ${token}`, ...headers},
          body: JSON.stringify({
            name: "my-lib",
            version: "1.0.0",
            digest: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            registry_url: "https://my-registry.org"
          })
        })
        .reply(201, {storage_records: [{id: '123'}, {id: '456'}]})
    })

    it('persists the storage record', async () => {
      await expect(
        createStorageRecord(artifactParams, registryParams, token, {headers})
      ).resolves.toEqual(['123', '456'])
    })
  })

  describe('when the api call fails', () => {
    beforeEach(() => {
      mockAgent
        .get('https://api.github.com')
        .intercept({
          path: '/orgs/foo/artifacts/metadata/storage-record',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({
            name: "my-lib",
            version: "1.0.0",
            digest: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            registry_url: "https://my-registry.org"
          })
        })
        .reply(500, 'oops')
    })

    it('throws an error', async () => {
      await expect(
        createStorageRecord(artifactParams, registryParams, token, {retry: 0})
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
          body: JSON.stringify({...artifactParams, registry_url: registryParams.registryUrl})
        })
        .reply(500, 'oops')
        .times(1)

      pool
        .intercept({
          path: '/repos/foo/bar/attestations',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({})
        })
        .reply(201, {storage_records: [{id: '123'}, {id: '456'}]})
        .times(1)
    })

    it('persists the attestation', async () => {
      await expect(createStorageRecord(artifactParams, registryParams, token)).resolves.toEqual('123')
    })
  })
})
