import * as core from '@actions/core'
import * as path from 'path'
import {saveCache} from '../src/cache'
import * as cacheHttpClient from '../src/internal/cacheHttpClient'
import * as cacheUtils from '../src/internal/cacheUtils'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import * as tar from '../src/internal/tar'

jest.mock('@actions/core')
jest.mock('../src/internal/cacheHttpClient')
jest.mock('../src/internal/cacheUtils')
jest.mock('../src/internal/tar')

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
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

test('save with missing input outputs warning', async () => {
  const logWarningMock = jest.spyOn(cacheUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const inputPath = ''
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  await saveCache(inputPath, primaryKey)

  expect(logWarningMock).toHaveBeenCalledWith(
    'Input required and not supplied: path'
  )
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with large cache outputs warning', async () => {
  const logWarningMock = jest.spyOn(cacheUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const inputPath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(inputPath)]

  const createTarMock = jest.spyOn(tar, 'createTar')

  const cacheSize = 6 * 1024 * 1024 * 1024 //~6GB, over the 5GB limit
  jest.spyOn(cacheUtils, 'getArchiveFileSize').mockImplementationOnce(() => {
    return cacheSize
  })
  const compression = CompressionMethod.Gzip
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await saveCache(inputPath, primaryKey)

  const archiveFolder = '/foo/bar'

  expect(createTarMock).toHaveBeenCalledTimes(1)
  expect(createTarMock).toHaveBeenCalledWith(
    archiveFolder,
    cachePaths,
    compression
  )
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Cache size of ~6144 MB (6442450944 B) is over the 5GB limit, not saving cache.'
  )
  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with reserve cache failure outputs warning', async () => {
  const infoMock = jest.spyOn(core, 'info')
  const logWarningMock = jest.spyOn(cacheUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const inputPath = 'node_modules'
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
    .mockReturnValue(Promise.resolve(compression))

  await saveCache(inputPath, primaryKey)

  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, inputPath, {
    compressionMethod: compression
  })

  expect(infoMock).toHaveBeenCalledWith(
    `Unable to reserve cache with key ${primaryKey}, another job may be creating this cache.`
  )

  expect(createTarMock).toHaveBeenCalledTimes(0)
  expect(saveCacheMock).toHaveBeenCalledTimes(0)
  expect(logWarningMock).toHaveBeenCalledTimes(0)
  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with server error outputs warning', async () => {
  const logWarningMock = jest.spyOn(cacheUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const inputPath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(inputPath)]

  const cacheId = 4
  const reserveCacheMock = jest
    .spyOn(cacheHttpClient, 'reserveCache')
    .mockImplementation(async () => {
      return cacheId
    })

  const createTarMock = jest.spyOn(tar, 'createTar')

  const saveCacheMock = jest
    .spyOn(cacheHttpClient, 'saveCache')
    .mockImplementationOnce(async () => {
      throw new Error('HTTP Error Occurred')
    })
  const compression = CompressionMethod.Zstd
  const getCompressionMock = jest
    .spyOn(cacheUtils, 'getCompressionMethod')
    .mockReturnValue(Promise.resolve(compression))

  await saveCache(inputPath, primaryKey)

  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, inputPath, {
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
  expect(saveCacheMock).toHaveBeenCalledWith(cacheId, archiveFile)

  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith('HTTP Error Occurred')

  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})

test('save with valid inputs uploads a cache', async () => {
  const failedMock = jest.spyOn(core, 'setFailed')

  const inputPath = 'node_modules'
  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const cachePaths = [path.resolve(inputPath)]

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

  await saveCache(inputPath, primaryKey)

  expect(reserveCacheMock).toHaveBeenCalledTimes(1)
  expect(reserveCacheMock).toHaveBeenCalledWith(primaryKey, inputPath, {
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
  expect(saveCacheMock).toHaveBeenCalledWith(cacheId, archiveFile)

  expect(failedMock).toHaveBeenCalledTimes(0)
  expect(getCompressionMock).toHaveBeenCalledTimes(1)
})
