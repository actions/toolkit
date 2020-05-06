import * as core from '@actions/core'
import * as path from 'path'
import {restoreCache} from '../src/cache'
import * as cacheHttpClient from '../src/internal/cacheHttpClient'
import * as cacheUtils from '../src/internal/cacheUtils'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import {ArtifactCacheEntry} from '../src/internal/contracts'
import * as tar from '../src/internal/tar'

jest.mock('../src/internal/cacheHttpClient')
jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/tar')

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  jest.spyOn(cacheUtils, 'getCacheFileName').mockImplementation(cm => {
    const actualUtils = jest.requireActual('../src/internal/cacheUtils')
    return actualUtils.getCacheFileName(cm)
  })
})

test('restore with no path should fail', async () => {
  const inputPath = ''
  const key = 'node-test'
  const failedMock = jest.spyOn(core, 'setFailed')
  await restoreCache(inputPath, key)
  expect(failedMock).toHaveBeenCalledWith(
    'Input required and not supplied: path'
  )
})

test('restore with too many keys should fail', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'
  const restoreKeys = [...Array(20).keys()].map(x => x.toString())
  const failedMock = jest.spyOn(core, 'setFailed')
  await restoreCache(inputPath, key, restoreKeys)
  expect(failedMock).toHaveBeenCalledWith(
    `Key Validation Error: Keys are limited to a maximum of 10.`
  )
})

test('restore with large key should fail', async () => {
  const inputPath = 'node_modules'
  const key = 'foo'.repeat(512) // Over the 512 character limit
  const failedMock = jest.spyOn(core, 'setFailed')
  await restoreCache(inputPath, key)
  expect(failedMock).toHaveBeenCalledWith(
    `Key Validation Error: ${key} cannot be larger than 512 characters.`
  )
})

test('restore with invalid key should fail', async () => {
  const inputPath = 'node_modules'
  const key = 'comma,comma'
  const failedMock = jest.spyOn(core, 'setFailed')
  await restoreCache(inputPath, key)
  expect(failedMock).toHaveBeenCalledWith(
    `Key Validation Error: ${key} cannot contain commas.`
  )
})

test('restore with no cache found', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'

  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const clientMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  clientMock.mockImplementation(async () => {
    return Promise.resolve(null)
  })

  await restoreCache(inputPath, key)

  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(infoMock).toHaveBeenCalledWith(
    `Cache not found for input keys: ${key}`
  )
})

test('restore with server error should fail', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'

  const logWarningMock = jest.spyOn(cacheUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const clientMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  clientMock.mockImplementation(() => {
    throw new Error('HTTP Error Occurred')
  })

  await restoreCache(inputPath, key)

  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith('HTTP Error Occurred')
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('restore with restore keys and no cache found', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'
  const restoreKey = 'node-'

  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const clientMock = jest.spyOn(cacheHttpClient, 'getCacheEntry')
  clientMock.mockImplementation(async () => {
    return Promise.resolve(null)
  })

  await restoreCache(inputPath, key, [restoreKey])

  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(infoMock).toHaveBeenCalledWith(
    `Cache not found for input keys: ${key}, ${restoreKey}`
  )
})

test('restore with gzip compressed cache found', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'

  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/master',
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
  const getArchiveFileSizeMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSize')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const unlinkFileMock = jest.spyOn(cacheUtils, 'unlinkFile')

  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await restoreCache(inputPath, key)

  expect(getCacheMock).toHaveBeenCalledWith([key], inputPath, {
    compressionMethod: compression
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath
  )
  expect(getArchiveFileSizeMock).toHaveBeenCalledWith(archivePath)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)

  expect(unlinkFileMock).toHaveBeenCalledTimes(1)
  expect(unlinkFileMock).toHaveBeenCalledWith(archivePath)

  expect(infoMock).toHaveBeenCalledWith(`Cache restored from key: ${key}`)
  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('restore with a pull request event and zstd compressed cache found', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'

  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: key,
    scope: 'refs/heads/master',
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
  const getArchiveFileSizeMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSize')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await restoreCache(inputPath, key)

  expect(getCacheMock).toHaveBeenCalledWith([key], inputPath, {
    compressionMethod: compression
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath
  )
  expect(getArchiveFileSizeMock).toHaveBeenCalledWith(archivePath)
  expect(infoMock).toHaveBeenCalledWith(`Cache Size: ~60 MB (62915000 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)

  expect(infoMock).toHaveBeenCalledWith(`Cache restored from key: ${key}`)
  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('restore with cache found for restore key', async () => {
  const inputPath = 'node_modules'
  const key = 'node-test'
  const restoreKey = 'node-'

  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const cacheEntry: ArtifactCacheEntry = {
    cacheKey: restoreKey,
    scope: 'refs/heads/master',
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
  const getArchiveFileSizeMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSize')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await restoreCache(inputPath, key, [restoreKey])

  expect(getCacheMock).toHaveBeenCalledWith([key, restoreKey], inputPath, {
    compressionMethod: compression
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheMock).toHaveBeenCalledWith(
    cacheEntry.archiveLocation,
    archivePath
  )
  expect(getArchiveFileSizeMock).toHaveBeenCalledWith(archivePath)
  expect(infoMock).toHaveBeenCalledWith(`Cache Size: ~0 MB (142 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compression)

  expect(infoMock).toHaveBeenCalledWith(
    `Cache restored from key: ${restoreKey}`
  )
  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})
