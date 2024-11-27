import * as core from '@actions/core'
import * as path from 'path'
import * as tar from '../src/internal/tar'
import * as config from '../src/internal/config'
import * as cacheUtils from '../src/internal/cacheUtils'
import * as downloadUtils from '../src/internal/downloadUtils'
import {restoreCache} from '../src/cache'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import {CacheServiceClientJSON} from '../src/generated/results/api/v1/cache.twirp'
import {DownloadOptions} from '../src/options'

jest.mock('../src/internal/cacheHttpClient')
jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/config')
jest.mock('../src/internal/tar')

let logDebugMock: jest.SpyInstance
let logInfoMock: jest.SpyInstance

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})

  jest.spyOn(cacheUtils, 'getCacheFileName').mockImplementation(cm => {
    const actualUtils = jest.requireActual('../src/internal/cacheUtils')
    return actualUtils.getCacheFileName(cm)
  })

  // Ensure that we're using v2 for these tests
  jest.spyOn(config, 'getCacheServiceVersion').mockReturnValue('v2')

  logDebugMock = jest.spyOn(core, 'debug')
  logInfoMock = jest.spyOn(core, 'info')
})

afterEach(() => {
  expect(logDebugMock).toHaveBeenCalledWith('Cache service version: v2')
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

  jest
    .spyOn(CacheServiceClientJSON.prototype, 'GetCacheEntryDownloadURL')
    .mockReturnValue(
      Promise.resolve({
        ok: false,
        signedDownloadUrl: '',
        matchedKey: ''
      })
    )

  const cacheKey = await restoreCache(paths, key)

  expect(cacheKey).toBe(undefined)
})

test('restore with server error should fail', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const logWarningMock = jest.spyOn(core, 'warning')

  jest
    .spyOn(CacheServiceClientJSON.prototype, 'GetCacheEntryDownloadURL')
    .mockImplementation(() => {
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
  const restoreKeys = ['node-']
  const logWarningMock = jest.spyOn(core, 'warning')

  jest
    .spyOn(CacheServiceClientJSON.prototype, 'GetCacheEntryDownloadURL')
    .mockReturnValue(
      Promise.resolve({
        ok: false,
        signedDownloadUrl: '',
        matchedKey: ''
      })
    )

  const cacheKey = await restoreCache(paths, key, restoreKeys)

  expect(cacheKey).toBe(undefined)
  expect(logWarningMock).toHaveBeenCalledWith(
    `Cache not found for keys: ${[key, ...restoreKeys].join(', ')}`
  )
})

test('restore with gzip compressed cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const compressionMethod = CompressionMethod.Gzip
  const signedDownloadUrl = 'https://blob-storage.local?signed=true'
  const cacheVersion =
    'd90f107aaeb22920dba0c637a23c37b5bc497b4dfa3b07fe3f79bf88a273c11b'
  const options: DownloadOptions = {timeoutInMs: 30000}

  const getCacheVersionMock = jest.spyOn(cacheUtils, 'getCacheVersion')
  getCacheVersionMock.mockReturnValue(cacheVersion)

  const compressionMethodMock = jest.spyOn(cacheUtils, 'getCompressionMethod')
  compressionMethodMock.mockReturnValue(Promise.resolve(compressionMethod))

  const getCacheDownloadURLMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'GetCacheEntryDownloadURL'
  )
  getCacheDownloadURLMock.mockReturnValue(
    Promise.resolve({
      ok: true,
      signedDownloadUrl,
      matchedKey: key
    })
  )

  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Gzip)
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )
  downloadCacheStorageSDKMock.mockReturnValue(Promise.resolve())

  const fileSize = 142
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const unlinkFileMock = jest.spyOn(cacheUtils, 'unlinkFile')

  const cacheKey = await restoreCache(paths, key)

  expect(cacheKey).toBe(key)
  expect(getCacheVersionMock).toHaveBeenCalledWith(
    paths,
    compressionMethod,
    false
  )
  expect(getCacheDownloadURLMock).toHaveBeenCalledWith({
    key,
    restoreKeys: [],
    version: cacheVersion
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledWith(
    signedDownloadUrl,
    archivePath,
    options
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)
  expect(logInfoMock).toHaveBeenCalledWith(`Cache Size: ~0 MB (142 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compressionMethod)

  expect(unlinkFileMock).toHaveBeenCalledTimes(1)
  expect(unlinkFileMock).toHaveBeenCalledWith(archivePath)

  expect(compressionMethodMock).toHaveBeenCalledTimes(1)
})

test('restore with zstd compressed cache found', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const compressionMethod = CompressionMethod.Zstd
  const signedDownloadUrl = 'https://blob-storage.local?signed=true'
  const cacheVersion =
    '8e2e96a184cb0cd6b48285b176c06a418f3d7fce14c29d9886fd1bb4f05c513d'
  const options: DownloadOptions = {timeoutInMs: 30000}

  const getCacheVersionMock = jest.spyOn(cacheUtils, 'getCacheVersion')
  getCacheVersionMock.mockReturnValue(cacheVersion)

  const compressionMethodMock = jest.spyOn(cacheUtils, 'getCompressionMethod')
  compressionMethodMock.mockReturnValue(Promise.resolve(compressionMethod))

  const getCacheDownloadURLMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'GetCacheEntryDownloadURL'
  )
  getCacheDownloadURLMock.mockReturnValue(
    Promise.resolve({
      ok: true,
      signedDownloadUrl,
      matchedKey: key
    })
  )

  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Zstd)
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )
  downloadCacheStorageSDKMock.mockReturnValue(Promise.resolve())

  const fileSize = 62915000
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const unlinkFileMock = jest.spyOn(cacheUtils, 'unlinkFile')

  const cacheKey = await restoreCache(paths, key)

  expect(cacheKey).toBe(key)
  expect(getCacheVersionMock).toHaveBeenCalledWith(
    paths,
    compressionMethod,
    false
  )
  expect(getCacheDownloadURLMock).toHaveBeenCalledWith({
    key,
    restoreKeys: [],
    version: cacheVersion
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledWith(
    signedDownloadUrl,
    archivePath,
    options
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)
  expect(logInfoMock).toHaveBeenCalledWith(`Cache Size: ~60 MB (62915000 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compressionMethod)

  expect(unlinkFileMock).toHaveBeenCalledTimes(1)
  expect(unlinkFileMock).toHaveBeenCalledWith(archivePath)

  expect(compressionMethodMock).toHaveBeenCalledTimes(1)
})

test('restore with cache found for restore key', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const restoreKeys = ['node-']
  const compressionMethod = CompressionMethod.Gzip
  const signedDownloadUrl = 'https://blob-storage.local?signed=true'
  const cacheVersion =
    'b8b58e9bd7b1e8f83d9f05c7e06ea865ba44a0330e07a14db74ac74386677bed'
  const options: DownloadOptions = {timeoutInMs: 30000}

  const getCacheVersionMock = jest.spyOn(cacheUtils, 'getCacheVersion')
  getCacheVersionMock.mockReturnValue(cacheVersion)

  const compressionMethodMock = jest.spyOn(cacheUtils, 'getCompressionMethod')
  compressionMethodMock.mockReturnValue(Promise.resolve(compressionMethod))

  const getCacheDownloadURLMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'GetCacheEntryDownloadURL'
  )
  getCacheDownloadURLMock.mockReturnValue(
    Promise.resolve({
      ok: true,
      signedDownloadUrl,
      matchedKey: restoreKeys[0]
    })
  )

  const tempPath = '/foo/bar'

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  createTempDirectoryMock.mockImplementation(async () => {
    return Promise.resolve(tempPath)
  })

  const archivePath = path.join(tempPath, CacheFilename.Gzip)
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )
  downloadCacheStorageSDKMock.mockReturnValue(Promise.resolve())

  const fileSize = 142
  const getArchiveFileSizeInBytesMock = jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValue(fileSize)

  const extractTarMock = jest.spyOn(tar, 'extractTar')
  const unlinkFileMock = jest.spyOn(cacheUtils, 'unlinkFile')

  const cacheKey = await restoreCache(paths, key, restoreKeys)

  expect(cacheKey).toBe(restoreKeys[0])
  expect(getCacheVersionMock).toHaveBeenCalledWith(
    paths,
    compressionMethod,
    false
  )
  expect(getCacheDownloadURLMock).toHaveBeenCalledWith({
    key,
    restoreKeys,
    version: cacheVersion
  })
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledWith(
    signedDownloadUrl,
    archivePath,
    options
  )
  expect(getArchiveFileSizeInBytesMock).toHaveBeenCalledWith(archivePath)
  expect(logInfoMock).toHaveBeenCalledWith(`Cache Size: ~0 MB (142 B)`)

  expect(extractTarMock).toHaveBeenCalledTimes(1)
  expect(extractTarMock).toHaveBeenCalledWith(archivePath, compressionMethod)

  expect(unlinkFileMock).toHaveBeenCalledTimes(1)
  expect(unlinkFileMock).toHaveBeenCalledWith(archivePath)

  expect(compressionMethodMock).toHaveBeenCalledTimes(1)
})

test('restore with dry run', async () => {
  const paths = ['node_modules']
  const key = 'node-test'
  const compressionMethod = CompressionMethod.Gzip
  const signedDownloadUrl = 'https://blob-storage.local?signed=true'
  const cacheVersion =
    'd90f107aaeb22920dba0c637a23c37b5bc497b4dfa3b07fe3f79bf88a273c11b'
  const options: DownloadOptions = {lookupOnly: true, timeoutInMs: 30000}

  const getCacheVersionMock = jest.spyOn(cacheUtils, 'getCacheVersion')
  getCacheVersionMock.mockReturnValue(cacheVersion)

  const compressionMethodMock = jest.spyOn(cacheUtils, 'getCompressionMethod')
  compressionMethodMock.mockReturnValue(Promise.resolve(compressionMethod))

  const getCacheDownloadURLMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'GetCacheEntryDownloadURL'
  )
  getCacheDownloadURLMock.mockReturnValue(
    Promise.resolve({
      ok: true,
      signedDownloadUrl,
      matchedKey: key
    })
  )

  const createTempDirectoryMock = jest.spyOn(cacheUtils, 'createTempDirectory')
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )
  downloadCacheStorageSDKMock.mockReturnValue(Promise.resolve())

  const cacheKey = await restoreCache(paths, key, undefined, options)

  expect(cacheKey).toBe(key)
  expect(getCacheVersionMock).toHaveBeenCalledWith(
    paths,
    compressionMethod,
    false
  )
  expect(getCacheDownloadURLMock).toHaveBeenCalledWith({
    key,
    restoreKeys: [],
    version: cacheVersion
  })
  expect(logInfoMock).toHaveBeenCalledWith('Lookup only - skipping download')

  // creating a tempDir and downloading the cache are skipped
  expect(createTempDirectoryMock).toHaveBeenCalledTimes(0)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
})
