import * as core from '@actions/core'
import * as path from 'path'
import {saveCache} from '../src/cache'
import * as cacheUtils from '../src/internal/cacheUtils'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import * as config from '../src/internal/config'
import * as tar from '../src/internal/tar'
import {CacheServiceClientJSON} from '../src/generated/results/api/v1/cache.twirp'
import * as uploadCacheModule from '../src/internal/blob/upload-cache'
import {BlobUploadCommonResponse} from '@azure/storage-blob'

let logDebugMock: jest.SpyInstance

jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/tar')

beforeAll(() => {
  process.env['ACTIONS_RUNTIME_TOKEN'] = 'token'
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})
  jest.spyOn(cacheUtils, 'getCacheFileName').mockImplementation(cm => {
    const actualUtils = jest.requireActual('../src/internal/cacheUtils')
    return actualUtils.getCacheFileName(cm)
  })
  jest.spyOn(cacheUtils, 'getCacheVersion').mockImplementation((paths, cm) => {
    const actualUtils = jest.requireActual('../src/internal/cacheUtils')
    return actualUtils.getCacheVersion(paths, cm)
  })
  jest.spyOn(cacheUtils, 'resolvePaths').mockImplementation(async filePaths => {
    return filePaths.map(x => path.resolve(x))
  })
  jest.spyOn(cacheUtils, 'createTempDirectory').mockImplementation(async () => {
    return Promise.resolve('/foo/bar')
  })

  // Ensure that we're using v2 for these tests
  jest.spyOn(config, 'getCacheServiceVersion').mockReturnValue('v2')

  logDebugMock = jest.spyOn(core, 'debug')
})

afterEach(() => {
  expect(logDebugMock).toHaveBeenCalledWith('Cache service version: v2')
  jest.clearAllMocks()
})

test('save with missing input should fail', async () => {
  const paths: string[] = []
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  await expect(saveCache(paths, primaryKey)).rejects.toThrowError(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('save with large cache outputs should fail using', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]

  const createTarMock = jest.spyOn(tar, 'createTar')
  const logWarningMock = jest.spyOn(core, 'warning')

  const cacheSize = 11 * 1024 * 1024 * 1024 //~11GB, over the 10GB limit
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(cacheSize)
  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  const cacheId = await saveCache([filePath], primaryKey)
  expect(cacheId).toBe(-1)
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Failed to save: Cache size of ~11264 MB (11811160064 B) is over the 10GB limit, not saving cache.'
  )

  const archiveFolder = '/foo/bar'

  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('create cache entry failure', async () => {
  const paths = ['node_modules']
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const infoLogMock = jest.spyOn(core, 'info')

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(Promise.resolve({ok: false, signedUploadUrl: ''}))

  const createTarMock = jest.spyOn(tar, 'createTar')
  const finalizeCacheEntryMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'FinalizeCacheEntryUpload'
  )
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))
  const cacheVersion = cacheUtils.getCacheVersion(paths, compression)
  const uploadCacheFileMock = jest
    .spyOn(uploadCacheModule, 'uploadCacheFile')
    .mockReturnValue(
      Promise.resolve({
        _response: {
          status: 200
        }
      } as BlobUploadCommonResponse)
    )

  const cacheId = await saveCache(paths, primaryKey)
  expect(cacheId).toBe(-1)
  expect(infoLogMock).toHaveBeenCalledTimes(1)
  expect(infoLogMock).toHaveBeenCalledWith(
    `Failed to save: Unable to reserve cache with key ${primaryKey}, another job may be creating this cache.`
  )

  expect(createCacheEntryMock).toHaveBeenCalledTimes(1)
  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key: primaryKey,
    version: cacheVersion
  })
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
  expect(finalizeCacheEntryMock).toHaveBeenCalledTimes(0)
  expect(uploadCacheFileMock).toHaveBeenCalledTimes(0)
})

test('finalize save cache failure', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]
  const logWarningMock = jest.spyOn(core, 'warning')
  const signedUploadURL = 'https://blob-storage.local?signed=true'

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL})
    )

  const createTarMock = jest.spyOn(tar, 'createTar')

  const uploadCacheMock = jest.spyOn(uploadCacheModule, 'uploadCacheFile')
  uploadCacheMock.mockReturnValue(
    Promise.resolve({
      _response: {
        status: 200
      }
    } as BlobUploadCommonResponse)
  )

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  const cacheVersion = cacheUtils.getCacheVersion([filePath], compression)
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(Promise.resolve({ok: false, entryId: ''}))

  const cacheId = await saveCache([filePath], primaryKey)

  expect(createCacheEntryMock).toHaveBeenCalledTimes(1)
  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key: primaryKey,
    version: cacheVersion
  })

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(uploadCacheMock).toHaveBeenCalledTimes(1)
  expect(uploadCacheMock).toHaveBeenCalledWith(signedUploadURL, archiveFile)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)

  expect(finalizeCacheEntryMock).toHaveBeenCalledTimes(1)
  expect(finalizeCacheEntryMock).toHaveBeenCalledWith({
    key: primaryKey,
    version: cacheVersion,
    sizeBytes: archiveFileSize.toString()
  })

  expect(cacheId).toBe(-1)
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    `Failed to save: Unable to finalize cache with key ${primaryKey}, another job may be finalizing this cache.`
  )
})

test('save with uploadCache Server error will fail', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const logWarningMock = jest.spyOn(core, 'warning')
  const signedUploadURL = 'https://signed-upload-url.com'
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL})
    )

  jest
    .spyOn(uploadCacheModule, 'uploadCacheFile')
    .mockReturnValueOnce(Promise.reject(new Error('HTTP Error Occurred')))

  const cacheId = await saveCache([filePath], primaryKey)

  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    `Failed to save: HTTP Error Occurred`
  )
  expect(cacheId).toBe(-1)
})

test('save with valid inputs uploads a cache', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const createTarMock = jest.spyOn(tar, 'createTar')

  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = 4
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL})
    )

  const uploadCacheMock = jest
    .spyOn(uploadCacheModule, 'uploadCacheFile')
    .mockReturnValue(
      Promise.resolve({
        _response: {
          status: 200
        }
      } as BlobUploadCommonResponse)
    )

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))
  const cacheVersion = cacheUtils.getCacheVersion([filePath], compression)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(Promise.resolve({ok: true, entryId: cacheId.toString()}))

  const expectedCacheId = await saveCache([filePath], primaryKey)

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(uploadCacheMock).toHaveBeenCalledTimes(1)
  expect(uploadCacheMock).toHaveBeenCalledWith(signedUploadURL, archiveFile)
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(finalizeCacheEntryMock).toHaveBeenCalledTimes(1)
  expect(finalizeCacheEntryMock).toHaveBeenCalledWith({
    key: primaryKey,
    version: cacheVersion,
    sizeBytes: archiveFileSize.toString()
  })

  expect(getCompressionMock).toHaveBeenCalledTimes(1)
  expect(expectedCacheId).toBe(cacheId)
})

test('save with non existing path should not save cache using v2 saveCache', async () => {
  const path = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  jest.spyOn(cacheUtils, 'resolvePaths').mockImplementation(async () => {
    return []
  })
  await expect(saveCache([path], primaryKey)).rejects.toThrowError(
    `Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`
  )
})
