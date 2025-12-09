import {MockAgent, setGlobalDispatcher} from 'undici'
import {createStorageRecord} from '../src/artifactMetadata'

describe('createStorageRecord', () => {
  const originalEnv = process.env
  const token = 'token'
  const headers = {'X-GitHub-Foo': 'true'}

  const artifactOptions = {
    name: 'my-lib',
    version: '1.0.0',
    digest: `sha256:${'a'.repeat(64)}`
  }
  const packageRegistryOptions = {
    registryUrl: 'https://my-registry.org'
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
            name: 'my-lib',
            version: '1.0.0',
            digest: `sha256:${'a'.repeat(64)}`,
            registry_url: 'https://my-registry.org'
          })
        })
        .reply(200, {storage_records: [{id: 123}, {id: 456}]})
    })

    it('persists the storage record', async () => {
      await expect(createStorageRecord(artifactOptions, packageRegistryOptions, token, undefined, headers)).resolves.toEqual([123, 456])
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
            name: 'my-lib',
            version: '1.0.0',
            digest: `sha256:${'a'.repeat(64)}`,
            registry_url: 'https://my-registry.org'
          })
        })
        .reply(500, 'oops')
    })

    it('throws an error', async () => {
      await expect(
        createStorageRecord(
          artifactOptions,
          packageRegistryOptions,
          token,
          0,
          headers
        )
      ).rejects.toThrow(/oops/)
    })
  })

  describe('when the api call fails but succeeds on retry', () => {
    beforeEach(() => {
      const pool = mockAgent.get('https://api.github.com')

      pool
        .intercept({
          path: '/orgs/foo/artifacts/metadata/storage-record',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({
            ...artifactOptions,
            registry_url: packageRegistryOptions.registryUrl
          })
        })
        .reply(500, 'oops')
        .times(1)

      pool
        .intercept({
          path: '/orgs/foo/artifacts/metadata/storage-record',
          method: 'POST',
          headers: {authorization: `token ${token}`},
          body: JSON.stringify({
            ...artifactOptions,
            registry_url: packageRegistryOptions.registryUrl
          })
        })
        .reply(200, {storage_records: [{id: 123}, {id: 456}]})
        .times(1)
    })

    it('persists the storage record', async () => {
      await expect(
        createStorageRecord(
          artifactOptions,
          packageRegistryOptions,
          token,
          undefined,
          headers
        )
      ).resolves.toEqual([123, 456])
    })
  })
})
