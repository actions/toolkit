import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {Readable} from 'stream'
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {
  downloadCache,
  getCacheEntry,
  saveCache
} from '../src/internal/cacheHttpClient'
import {getCacheVersion} from '../src/internal/cacheUtils'
import {CompressionMethod} from '../src/internal/constants'
import * as requestUtils from '../src/internal/requestUtils'
import {configureS3Cache} from '../src/cache'
import {HttpClientError} from '@actions/http-client'

test('getCacheVersion does not mutate arguments', async () => {
  const paths = ['node_modules']
  getCacheVersion(paths, undefined, true)
  expect(paths).toEqual(['node_modules'])
})

test('getCacheVersion with one path returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

test('getCacheVersion with multiple paths returns version', async () => {
  const paths = ['node_modules', 'dist']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    '165c3053bc646bf0d4fac17b1f5731caca6fe38e0e464715c0c3c6b6318bf436'
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
      '2db19d6596dc34f51f0043120148827a264863f5c6ac857569c2af7119bad14e'
    )
  }
})

test('getCacheEntry throws a generic status-code error for non-read-denied failures', async () => {
  // Regression: a non read-denied failure must NOT leak the server's body
  // message; it should surface the generic status-code error.
  jest.spyOn(requestUtils, 'retryTypedResponse').mockResolvedValue({
    statusCode: 403,
    result: null,
    headers: {},
    error: new HttpClientError('some other server detail', 403)
  })

  await expect(getCacheEntry(['key'], ['node_modules'])).rejects.toThrow(
    'Cache service responded with 403'
  )
})

test('getCacheEntry surfaces the body message for a cache read denial', async () => {
  jest.spyOn(requestUtils, 'retryTypedResponse').mockResolvedValue({
    statusCode: 403,
    result: null,
    headers: {},
    error: new HttpClientError(
      'cache read denied: token has no readable scopes',
      403
    )
  })

  await expect(getCacheEntry(['key'], ['node_modules'])).rejects.toThrow(
    'cache read denied: token has no readable scopes'
  )
})

test('configureS3Cache requires a bucket', () => {
  expect(() =>
    configureS3Cache({
      bucket: '',
      objectKey: 'cache/archive.tzst',
      s3ClientConfig: {
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key'
        }
      }
    })
  ).toThrow('S3 cache bucket must be configured.')
})

function configureCache(): void {
  configureS3Cache({
    bucket: 'cache-bucket',
    objectKey: 'cache/archive.tzst',
    s3ClientConfig: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key'
      }
    }
  })
}

test('downloadCache downloads the configured S3 object', async () => {
  configureCache()
  const archivePath = path.join(os.tmpdir(), `cache-${Date.now()}`)
  const sendMock = jest
    .spyOn(S3Client.prototype, 'send')
    .mockResolvedValue({Body: Readable.from('cache content')} as never)

  try {
    await downloadCache('https://ignored.example.test/cache', archivePath, {
      useAzureSdk: true,
      concurrentBlobDownloads: true
    })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {Bucket: 'cache-bucket', Key: 'cache/archive.tzst'}
      })
    )
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand)
    expect(fs.readFileSync(archivePath, 'utf8')).toBe('cache content')
  } finally {
    await fs.promises.rm(archivePath, {force: true})
  }
})

test('saveCache uploads to the configured S3 object', async () => {
  configureCache()
  const archivePath = path.join(os.tmpdir(), `cache-${Date.now()}`)
  fs.writeFileSync(archivePath, 'cache content')
  const sendMock = jest
    .spyOn(S3Client.prototype, 'send')
    .mockResolvedValue({} as never)

  try {
    await saveCache(1, archivePath, 'legacy-signature')

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'cache-bucket',
          Key: 'cache/archive.tzst'
        })
      })
    )
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand)
  } finally {
    await fs.promises.rm(archivePath, {force: true})
  }
})
