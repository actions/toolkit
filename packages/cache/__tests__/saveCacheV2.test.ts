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
import {InvalidResponseError} from '../src/internal/shared/errors'

let logDebugMock: jest.SpyInstance

jest.mock('../src/internal/tar')

beforeAll(() => {
  process.env['ACTIONS_RUNTIME_TOKEN'] = 'token'
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})
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
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  await expect(saveCache(paths, key)).rejects.toThrowError(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('save with large cache outputs should fail using', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]

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

  const cacheId = await saveCache([paths], key)
  expect(cacheId).toBe(-1)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Failed to save: Cache size of ~11264 MB (11811160064 B) is over the 10GB limit, not saving cache.'
  )

  const archiveFolder = '/foo/bar'

  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('create cache entry failure', async () => {
  const paths = ['node_modules']
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
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
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)
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

  const cacheId = await saveCache(paths, key)
  expect(cacheId).toBe(-1)
  expect(infoLogMock).toHaveBeenCalledWith(
    `Failed to save: Unable to reserve cache with key ${key}, another job may be creating this cache.`
  )

  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheVersion
  })
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
  expect(finalizeCacheEntryMock).toHaveBeenCalledTimes(0)
  expect(uploadCacheFileMock).toHaveBeenCalledTimes(0)
})

test('finalize save cache failure', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
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

  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(Promise.resolve({ok: false, entryId: ''}))

  const cacheId = await saveCache([paths], key)

  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheVersion
  })

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(uploadCacheMock).toHaveBeenCalledWith(signedUploadURL, archiveFile)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)

  expect(finalizeCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheVersion,
    sizeBytes: archiveFileSize.toString()
  })

  expect(cacheId).toBe(-1)
  expect(logWarningMock).toHaveBeenCalledWith(
    `Failed to save: Unable to finalize cache with key ${key}, another job may be finalizing this cache.`
  )
})

test('save with uploadCache Server error will fail', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL})
    )

  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)
  jest
    .spyOn(uploadCacheModule, 'uploadCacheFile')
    .mockRejectedValueOnce(new InvalidResponseError('boom'))

  const cacheId = await saveCache([paths], key)
  expect(cacheId).toBe(-1)
})

test('save with valid inputs uploads a cache', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
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
  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(Promise.resolve({ok: true, entryId: cacheId.toString()}))

  const expectedCacheId = await saveCache([paths], key)

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(uploadCacheMock).toHaveBeenCalledWith(signedUploadURL, archiveFile)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(finalizeCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheVersion,
    sizeBytes: archiveFileSize.toString()
  })

  expect(getCompressionMock).toHaveBeenCalledTimes(1)
  expect(expectedCacheId).toBe(cacheId)
})

test('save with non existing path should not save cache using v2 saveCache', async () => {
  const path = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  jest.spyOn(cacheUtils, 'resolvePaths').mockImplementation(async () => {
    return []
  })
  await expect(saveCache([path], key)).rejects.toThrowError(
    `Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`
  )
})
