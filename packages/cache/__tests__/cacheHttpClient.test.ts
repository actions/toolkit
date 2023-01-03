import {downloadCache, getCacheVersion} from '../src/internal/cacheHttpClient'
import {CompressionMethod} from '../src/internal/constants'
import * as downloadUtils from '../src/internal/downloadUtils'
import {DownloadOptions, getDownloadOptions} from '../src/options'

jest.mock('../src/internal/downloadUtils')

test('getCacheVersion with one path returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    'af166d7350340bdcd221c5040540ce3b06fb9569f007efe5271845113780e411'
  )
})

test('getCacheVersion with multiple paths returns version', async () => {
  const paths = ['node_modules', 'dist']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    'acd28d9f2ed4ee2787813c2a8e99462198b5a6db553b53d5eaae2a21c620561a'
  )
})

test('getCacheVersion with zstd compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Zstd, true)

  expect(result).toEqual(
    '273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24'
  )
})

test('getCacheVersion with gzip compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Gzip, true)

  expect(result).toEqual(
    '470e252814dbffc9524891b17cf4e5749b26c1b5026e63dd3f00972db2393117'
  )
})

test('getCacheVersion with enableCrossOsArchive as false returns version on windows', async () => {
  if (process.platform === 'win32') {
    const paths = ['node_modules']
    const result = getCacheVersion(paths)

    expect(result).toEqual(
      'eaba4356cfc2107bac38279c46571b074aac575cbd3e0bae72c7dc9dff1132d7'
    )
  }
})

test('downloadCache uses http-client for non-Azure URLs', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://www.actionscache.test/download'
  const archivePath = '/foo/bar'

  await downloadCache(archiveLocation, archivePath)

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
})

test('downloadCache uses storage SDK for Azure storage URLs', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'

  await downloadCache(archiveLocation, archivePath)

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath,
    getDownloadOptions()
  )

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(0)
})

test('downloadCache passes options to download methods', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'
  const options: DownloadOptions = {downloadConcurrency: 4}

  await downloadCache(archiveLocation, archivePath, options)

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheStorageSDKMock).toHaveBeenCalled()
  expect(downloadCacheStorageSDKMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath,
    getDownloadOptions(options)
  )

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(0)
})

test('downloadCache uses http-client when overridden', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'
  const options: DownloadOptions = {useAzureSdk: false}

  await downloadCache(archiveLocation, archivePath, options)

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
})
