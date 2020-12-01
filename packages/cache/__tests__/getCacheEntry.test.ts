import * as core from '@actions/core'
import {getCacheEntry} from '../src/cache'
import * as cacheHttpClient from '../src/internal/cacheHttpClient'
import {CompressionMethod} from '../src/internal/constants'
import {ArtifactCacheEntry} from '../src/internal/contracts'

jest.mock('../src/internal/cacheHttpClient')
jest.mock('../src/internal/cacheUtils')

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})
})

test('getCacheEntry with no path should fail', async () => {
  const paths: string[] = []
  const key = 'node-test'
  await expect(getCacheEntry(paths, key)).rejects.toThrowError(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('getCacheEntry with too many keys should fail', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKeys = [...Array(20).keys()].map(x => x.toString())
  await expect(
    getCacheEntry(paths, key, restoreKeys, CompressionMethod.Zstd)
  ).rejects.toThrowError(
    `Key Validation Error: Keys are limited to a maximum of 10.`
  )
})

test('getCacheEntry with large key should fail', async () => {
  const paths = ['node_modules']
  const key = 'foo'.repeat(512) // Over the 512 character limit
  await expect(getCacheEntry(paths, key)).rejects.toThrowError(
    `Key Validation Error: ${key} cannot be larger than 512 characters.`
  )
})

test('getCacheEntry with invalid key should fail', async () => {
  const paths = ['node_modules']
  const key = 'comma,comma'
  await expect(getCacheEntry(paths, key)).rejects.toThrowError(
    `Key Validation Error: ${key} cannot contain commas.`
  )
})

test('getCacheEntry with no cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  jest.spyOn(cacheHttpClient, 'getCacheEntry').mockImplementation(async () => {
    return Promise.resolve(null)
  })

  const cacheEntry = await getCacheEntry(paths, key)

  expect(cacheEntry).toBe(null)
})

test('getCacheEntry with server error should fail', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  jest.spyOn(cacheHttpClient, 'getCacheEntry').mockImplementation(() => {
    throw new Error('HTTP Error Occurred')
  })

  await expect(getCacheEntry(paths, key)).rejects.toThrowError(
    'HTTP Error Occurred'
  )
})

test('getCacheEntry with restore keys and no cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKey = 'node-'

  jest.spyOn(cacheHttpClient, 'getCacheEntry').mockImplementation(async () => {
    return Promise.resolve(null)
  })

  const cacheEntry = await getCacheEntry(
    paths,
    key,
    [restoreKey],
    CompressionMethod.Zstd
  )

  expect(cacheEntry).toBe(null)
})

test('getCacheEntry with gzip compressed cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })

  const compression = CompressionMethod.Gzip

  const result = await getCacheEntry(paths, key, undefined, compression)

  expect(result).toBe(cacheEntry)
  expect(getCacheMock).toHaveBeenCalledWith([key], paths, {
    compressionMethod: compression
  })
})

test('getCacheEntry with zstd compressed cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })

  const compression = CompressionMethod.Zstd

  const result = await getCacheEntry(paths, key, undefined, compression)

  expect(result).toBe(cacheEntry)
  expect(getCacheMock).toHaveBeenCalledWith([key], paths, {
    compressionMethod: compression
  })
})

test('getCacheEntry with cache found for restore key', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKey = 'node-'

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: restoreKey,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })

  const compression = CompressionMethod.Zstd

  const result = await getCacheEntry(paths, key, [restoreKey], compression)

  expect(result).toBe(cacheEntry)
  expect(getCacheMock).toHaveBeenCalledWith([key, restoreKey], paths, {
    compressionMethod: compression
  })
})
