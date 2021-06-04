import * as core from '@actions/core'
import * as path from 'path'
import {saveCache} from '../src/cache'
import * as cacheHttpClient from '../src/internal/cacheHttpClient'
import * as cacheUtils from '../src/internal/cacheUtils'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import * as tar from '../src/internal/tar'

jest.mock('../src/internal/cacheHttpClient')
jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/tar')

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

  jest.spyOn(cacheUtils, 'resolvePaths').mockImplementation(async filePaths => {
    return filePaths.map(x => path.resolve(x))
  })

  jest.spyOn(cacheUtils, 'createTempDirectory').mockImplementation(async () => {
    return Promise.resolve('/foo/bar')
  })
})

test('save with missing input should fail', async () => {
  const paths: string[] = []
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  await expect(saveCache(paths, primaryKey)).rejects.toThrowError(
    `Path Validation Error: At least one directory or file path is required`
  )
})

test('save with large cache outputs should fail', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]

  const createTarMock = jest.spyOn(tar, 'createTar')

  const cacheSize = 6 * 1024 * 1024 * 1024 //~6GB, over the 5GB limit
  jest
    .spyOn(cacheUtils, 'getArchiveFileSizeInBytes')
    .mockReturnValueOnce(cacheSize)
  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  await expect(saveCache([filePath], primaryKey)).rejects.toThrowError(
    'Cache size of ~6144 MB (6442450944 B) is over the 5GB limit, not saving cache.'
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

test('save with reserve cache failure should fail', async () => {
  const paths = ['node_modules']
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  const reserveCacheMock = jest
    .spyOn(cacheHttpClient, 'reserveCache')
    .mockImplementation(async () => {
      return -1
    })

  const createTarMock = jest.spyOn(tar, 'createTar')
  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  await expect(saveCache(paths, primaryKey)).rejects.toThrowError(
    `Unable to reserve cache with key ${primaryKey}, another job may be creating this cache.`
  )
  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, paths, {
    compressionMethod: compression
  })
  expect(createTarMock).toHaveBeenCalledTimes(0)
  expect(saveCacheMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with server error should fail', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]

  const cacheId = 4
  const reserveCacheMock = jest
    .spyOn(cacheHttpClient, 'reserveCache')
    .mockImplementation(async () => {
      return cacheId
    })

  const createTarMock = jest.spyOn(tar, 'createTar')

  const saveCacheMock = jest
    .spyOn(cacheHttpClient, 'saveCache')
    .mockImplementationOnce(() => {
      throw new Error('HTTP Error Occurred')
    })
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValueOnce(Promise.resolve(compression))

  await expect(saveCache([filePath], primaryKey)).rejects.toThrowError(
    'HTTP Error Occurred'
  )
  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, [filePath], {
    compressionMethod: compression
  })

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)

  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(cacheId, archiveFile, undefined)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with valid inputs uploads a cache', async () => {
  const filePath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(filePath)]

  const cacheId = 4
  const reserveCacheMock = jest
    .spyOn(cacheHttpClient, 'reserveCache')
    .mockImplementation(async () => {
      return cacheId
    })
  const createTarMock = jest.spyOn(tar, 'createTar')

  const saveCacheMock = jest.spyOn(cacheHttpClient, 'saveCache')
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await saveCache([filePath], primaryKey)

  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, [filePath], {
    compressionMethod: compression
  })

  const archiveFolder = '/foo/bar'
  const archiveFile = path.join(archiveFolder, CacheFilename.Zstd)

  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(cacheId, archiveFile, undefined)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})
