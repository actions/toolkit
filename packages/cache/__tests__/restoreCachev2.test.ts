import * as core from '@actions/core'
import * as path from 'path'
import { restoreCache } from '../src/cache'
import { CacheServiceClientJSON } from '../src/generated/results/api/v1/cache.twirp'
import * as cacheUtils from '../src/internal/cacheUtils'
import * as config from '../src/internal/config'
import { CacheFilename, CompressionMethod } from '../src/internal/constants'
import * as util from '@actions/artifact/lib/internal/shared/util'
import { ArtifactCacheEntry } from '../src/internal/contracts'
import * as tar from '../src/internal/tar'

jest.mock('../src/internal/cacheTwirpClient')
jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/tar')

const fixtures = {
  testRuntimeToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCBBY3Rpb25zLlJlc3VsdHM6Y2U3ZjU0YzctNjFjNy00YWFlLTg4N2YtMzBkYTQ3NWY1ZjFhOmNhMzk1MDg1LTA0MGEtNTI2Yi0yY2U4LWJkYzg1ZjY5Mjc3NCIsImlhdCI6MTUxNjIzOTAyMn0.XYnI_wHPBlUi1mqYveJnnkJhp4dlFjqxzRmISPsqfw8',
  backendIds: {
    workflowRunBackendId: 'c4d7c21f-ba3f-4ddc-a8c8-6f2f626f8422',
    workflowJobRunBackendId: '760803a1-f890-4d25-9a6e-a3fc01a0c7cf'
  },
  cacheServiceURL: 'http://results.local',
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { })
  jest.spyOn(core, 'debug').mockImplementation(() => { })
  jest.spyOn(core, 'info').mockImplementation(() => { })
  jest.spyOn(core, 'warning').mockImplementation(() => { })
  jest.spyOn(core, 'error').mockImplementation(() => { })

  jest.spyOn(cacheUtils, 'getCacheFileName').mockImplementation(cm => {
    const actualUtils = jest.requireActual('../src/internal/cacheUtils')
    return actualUtils.getCacheFileName(cm)
  })

  jest.spyOn(config, 'getCacheServiceVersion').mockImplementation(() => {
    return "v2"
  })

  jest.spyOn(config, 'getRuntimeToken').mockImplementation(() => {
    return fixtures.testRuntimeToken
  })

  jest.spyOn(util, 'getBackendIdsFromToken').mockImplementation(() => {
    return fixtures.backendIds
  })

  jest.spyOn(config, 'getCacheServiceURL').mockReturnValue(
    fixtures.cacheServiceURL
  )
})

test('restore with no path should fail', async () => {
  const paths: string[] = []
  const key = 'node-test'
  await expect(restoreCache(paths, key)).rejects.toThrowError(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('restore with too many keys should fail', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKeys = [...Array(20).keys()].map(x => x.toString())
  await expect(restoreCache(paths, key, restoreKeys)).rejects.toThrowError(
    `Key Validation Error: Keys are limited to a maximum of 10.`
  )
})

test('restore with large key should fail', async () => {
  const paths = ['node_modules']
  const key = 'foo'.repeat(512) // Over the 512 character limit
  await expect(restoreCache(paths, key)).rejects.toThrowError(
    `Key Validation Error: ${key} cannot be larger than 512 characters.`
  )
})

test('restore with invalid key should fail', async () => {
  const paths = ['node_modules']
  const key = 'comma,comma'
  await expect(restoreCache(paths, key)).rejects.toThrowError(
    `Key Validation Error: ${key} cannot contain commas.`
  )
})

test('restore with no cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  jest.spyOn(CacheServiceClientJSON.prototype, 'GetCacheEntryDownloadURL')
    .mockReturnValue(
      Promise.resolve({
        ok: false,
        signedDownloadUrl: ''
      })
    )

  const cacheKey = await restoreCache(paths, key)
  expect(cacheKey).toBe(undefined)
})

/**
test('restore with server error should fail', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const logWarningMock = jest.spyOn(core, 'warning')

  jest.spyOn(cacheHttpClient, 'getCacheEntry').mockImplementation(() => {
    throw new Error('HTTP Error Occurred')
  })

  const cacheKey = await restoreCache(paths, key)
  expect(cacheKey).toBe(undefined)
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Failed to restore: HTTP Error Occurred'
  )
})

test('restore with restore keys and no cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKey = 'node-'

  jest.spyOn(cacheHttpClient, 'getCacheEntry').mockImplementation(async () => {
    return Promise.resolve(null)
  })

  const cacheKey = await restoreCache(paths, key, [restoreKey])

  expect(cacheKey).toBe(undefined)
})

test('restore with gzip compressed cache found', async () => {
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

  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Gzip)
  const downloadCacheMock = jest.spyOn(cacheHttpClient, 'downloadCache')

  const fileSize = 142
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const unlinkFileMock = jest.spyOn(cacheUtils, 'unlinkFile')

  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  const cacheKey = await restoreCache(paths, key)

  expect(cacheKey).toBe(key)
  expect(getCacheMock).toHaveBeenCalledWith([key], paths, {
    compressionMethod: compression,
    enableCrossOsArchive: false
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath,
    undefined
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)

  expect(unlinkFileMock).toHaveBeenCalledTimes(1)
  expect(unlinkFileMock).toHaveBeenCalledWith(archivePath)

  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('restore with zstd compressed cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'

  const infoMock = jest.spyOn(core, 'info')

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })
  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Zstd)
  const downloadCacheMock = jest.spyOn(cacheHttpClient, 'downloadCache')

  const fileSize = 62915000
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  const cacheKey = await restoreCache(paths, key)

  expect(cacheKey).toBe(key)
  expect(getCacheMock).toHaveBeenCalledWith([key], paths, {
    compressionMethod: compression,
    enableCrossOsArchive: false
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath,
    undefined
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)
  expect(infoMock).toHaveBeenCalledWith(`Cache Size: ~60 MB (62915000 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('restore with cache found for restore key', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKey = 'node-'

  const infoMock = jest.spyOn(core, 'info')

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: restoreKey,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })
  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Zstd)
  const downloadCacheMock = jest.spyOn(cacheHttpClient, 'downloadCache')

  const fileSize = 142
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  const cacheKey = await restoreCache(paths, key, [restoreKey])

  expect(cacheKey).toBe(restoreKey)
  expect(getCacheMock).toHaveBeenCalledWith([key, restoreKey], paths, {
    compressionMethod: compression,
    enableCrossOsArchive: false
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath,
    undefined
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)
  expect(infoMock).toHaveBeenCalledWith(`Cache Size: ~0 MB (142 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('restore with dry run', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const options = { lookupOnly: true }

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/main',
    archiveLocation: 'www.actionscache.test/download'
  }
  const getCacheMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  getCacheMock.mockImplementation(async () => {
    return Promise.resolve(cacheEntry)
  })

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  const downloadCacheMock = jest.spyOn(cacheHttpClient, 'downloadCache')

  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  const cacheKey = await restoreCache(paths, key, undefined, options)

  expect(cacheKey).toBe(key)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
  expect(getCacheMock).toHaveBeenCalledWith([key], paths, {
    compressionMethod: compression,
    enableCrossOsArchive: false
  })
  // creating a tempDir and downloading the cache are skipped
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(0)
  expect(downloadCacheMock).toHaveBeenCalledTimes(0)
})
  **/