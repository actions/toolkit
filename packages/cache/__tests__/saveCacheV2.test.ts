import * as core from '@actions/core'
import * as path from 'path'
import {saveCache} from '../src/cache'
import * as cacheUtils from '../src/internal/cacheUtils'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import * as config from '../src/internal/config'
import * as tar from '../src/internal/tar'
import {CacheServiceClientJSON} from '../src/generated/results/api/v1/cache.twirp-client'
import * as cacheHttpClient from '../src/internal/cacheHttpClient'
import {UploadOptions} from '../src/options'

let logDebugMock: jest.SpyInstance

jest.mock('../src/internal/tar')

const uploadFileMock = jest.fn()
const blockBlobClientMock = jest.fn().mockImplementation(() => ({
  uploadFile: uploadFileMock
}))
jest.mock('@azure/storage-blob', () => ({
  BlobClient: jest.fn().mockImplementation(() => {
    return {
      getBlockBlobClient: blockBlobClientMock
    }
  })
}))

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

  await expect(saveCache(paths, key)).rejects.toThrow(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('create cache entry failure on non-ok response', async () => {
  const paths = ['node_modules']
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const infoLogMock = jest.spyOn(core, 'info')

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockResolvedValue({ok: false, signedUploadUrl: '', message: ''})

  const createTarMock = jest.spyOn(tar, 'createTar')
  const finalizeCacheEntryMock = jest.spyOn(
    CacheServiceClientJSON.prototype,
    'FinalizeCacheEntryUpload'
  )
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockResolvedValueOnce(compression)
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)
  const cacheVersion = cacheUtils.getCacheVersion(paths, compression)
  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')

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
  expect(saveCacheMock).toHaveBeenCalledTimes(0)
})

test('create cache entry fails on rejected promise', async () => {
  const paths = ['node_modules']
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const infoLogMock = jest.spyOn(core, 'info')

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockRejectedValue(new Error('Failed to create cache entry'))

  const createTarMock = jest.spyOn(tar, 'createTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockResolvedValueOnce(compression)
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = await saveCache(paths, key)
  expect(cacheId).toBe(-1)
  expect(infoLogMock).toHaveBeenCalledWith(
    `Failed to save: Unable to reserve cache with key ${key}, another job may be creating this cache.`
  )

  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheUtils.getCacheVersion(paths, compression)
  })
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save cache fails if a signedUploadURL was not passed', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
  const signedUploadURL = ''
  const archiveFileSize = 1024
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize, // These should always match
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const createTarMock = jest.spyOn(tar, 'createTar')
  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = await saveCache([paths], key, options)

  expect(cacheId).toBe(-1)
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

  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('finalize save cache failure', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
  const logWarningMock = jest.spyOn(core, 'warning')
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const archiveFileSize = 1024
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize, // These should always match
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const createTarMock = jest.spyOn(tar, 'createTar')
  const saveCacheMock = jest
    .spyOn(cacheHttpClient, 'saveCache')
    .mockResolvedValue(Promise.resolve())

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(Promise.resolve({ok: false, entryId: '', message: ''}))

  const cacheId = await saveCache([paths], key, options)

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

  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
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

test('save with valid inputs uploads a cache', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const createTarMock = jest.spyOn(tar, 'createTar')
  const archiveFileSize = 1024
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize, // These should always match
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = 4
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))
  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(
      Promise.resolve({ok: true, entryId: cacheId.toString(), message: ''})
    )

  const expectedCacheId = await saveCache([paths], key)

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
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

test('save with extremely large cache should succeed in v2 (no size limit)', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const createTarMock = jest.spyOn(tar, 'createTar')
  // Simulate a very large cache (20GB)
  const archiveFileSize = 20 * 1024 * 1024 * 1024 // 20GB
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize,
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = 4
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))
  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(
      Promise.resolve({ok: true, entryId: cacheId.toString(), message: ''})
    )

  const expectedCacheId = await saveCache([paths], key)

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
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

test('save with create cache entry failure and specific error message', async () => {
  const paths = ['node_modules']
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const infoLogMock = jest.spyOn(core, 'info')
  const warningLogMock = jest.spyOn(core, 'warning')
  const errorMessage = 'Cache storage quota exceeded for repository'

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockResolvedValue({ok: false, signedUploadUrl: '', message: errorMessage})

  const createTarMock = jest.spyOn(tar, 'createTar')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockResolvedValueOnce(compression)
  const archiveFileSize = 1024
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = await saveCache(paths, key)
  expect(cacheId).toBe(-1)
  expect(warningLogMock).toHaveBeenCalledWith(
    `Cache reservation failed: ${errorMessage}`
  )
  expect(infoLogMock).toHaveBeenCalledWith(
    `Failed to save: Unable to reserve cache with key ${key}, another job may be creating this cache.`
  )

  expect(createCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheUtils.getCacheVersion(paths, compression)
  })
  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with finalize cache entry failure and specific error message', async () => {
  const paths = 'node_modules'
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(paths)]
  const logWarningMock = jest.spyOn(core, 'warning')
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const archiveFileSize = 1024
  const errorMessage =
    'Cache entry finalization failed due to concurrent access'
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize,
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  const createCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const createTarMock = jest.spyOn(tar, 'createTar')
  const saveCacheMock = jest
    .spyOn(cacheHttpClient, 'saveCache')
    .mockResolvedValue()

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  const cacheVersion = cacheUtils.getCacheVersion([paths], compression)
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(
      Promise.resolve({ok: false, entryId: '', message: errorMessage})
    )

  const cacheId = await saveCache([paths], key, options)

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

  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
  expect(getCompressionMock).toHaveBeenCalledTimes(1)

  expect(finalizeCacheEntryMock).toHaveBeenCalledWith({
    key,
    version: cacheVersion,
    sizeBytes: archiveFileSize.toString()
  })

  expect(cacheId).toBe(-1)
  expect(logWarningMock).toHaveBeenCalledWith(errorMessage)
})

test('save with multiple large caches should succeed in v2 (testing 50GB)', async () => {
  const paths = ['large-dataset', 'node_modules', 'build-artifacts']
  const key = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = paths.map(p => path.resolve(p))
  const signedUploadURL = 'https://blob-storage.local?signed=true'
  const createTarMock = jest.spyOn(tar, 'createTar')
  // Simulate an extremely large cache (50GB)
  const archiveFileSize = 50 * 1024 * 1024 * 1024 // 50GB
  const options: UploadOptions = {
    archiveSizeBytes: archiveFileSize,
    useAzureSdk: true,
    uploadChunkSize: 64 * 1024 * 1024,
    uploadConcurrency: 8
  }

  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(archiveFileSize)

  const cacheId = 7
  jest
    .spyOn(CacheServiceClientJSON.prototype, 'CreateCacheEntry')
    .mockReturnValue(
      Promise.resolve({ok: true, signedUploadUrl: signedUploadURL, message: ''})
    )

  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')

  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))
  const cacheVersion = cacheUtils.getCacheVersion(paths, compression)

  const finalizeCacheEntryMock = jest
    .spyOn(CacheServiceClientJSON.prototype, 'FinalizeCacheEntryUpload')
    .mockReturnValue(
      Promise.resolve({ok: true, entryId: cacheId.toString(), message: ''})
    )

  const expectedCacheId = await saveCache(paths, key)

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)
  expect(saveCacheMock).toHaveBeenCalledWith(
    -1,
    archiveFile,
    signedUploadURL,
    options
  )
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
  await expect(saveCache([path], key)).rejects.toThrow(
    `Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`
  )
})
