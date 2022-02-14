import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IRequestOptions, ITypedResponse} from '@actions/http-client/interfaces'
import {
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  S3Client,
  S3ClientConfig,
  _Object
} from '@aws-sdk/client-s3'
import { Progress, Upload } from '@aws-sdk/lib-storage'
import * as crypto from 'crypto'
import * as fs from 'fs'
import {URL} from 'url'

import * as utils from './cacheUtils'
import {CompressionMethod} from './constants'
import {
  ArtifactCacheEntry,
  InternalCacheOptions,
  CommitCacheRequest,
  ReserveCacheRequest,
  ReserveCacheResponse
} from './contracts'
import {downloadCacheHttpClient, downloadCacheStorageS3, downloadCacheStorageSDK} from './downloadUtils'
import {
  DownloadOptions,
  UploadOptions,
  getDownloadOptions,
  getUploadOptions
} from '../options'
import {
  isSuccessStatusCode,
  retryHttpClientResponse,
  retryTypedResponse
} from './requestUtils'

const versionSalt = '1.0'

function getCacheApiUrl(resource: string): string {
  // Ideally we just use ACTIONS_CACHE_URL
  const baseUrl: string = (
    process.env['ACTIONS_CACHE_URL'] ||
    process.env['ACTIONS_RUNTIME_URL'] ||
    ''
  ).replace('pipelines', 'artifactcache')
  if (!baseUrl) {
    throw new Error('Cache Service Url not found, unable to restore cache.')
  }

  const url = `${baseUrl}_apis/artifactcache/${resource}`
  core.debug(`Resource Url: ${url}`)
  return url
}

function createAcceptHeader(type: string, apiVersion: string): string {
  return `${type};api-version=${apiVersion}`
}

function getRequestOptions(): IRequestOptions {
  const requestOptions: IRequestOptions = {
    headers: {
      Accept: createAcceptHeader('application/json', '6.0-preview.1')
    }
  }

  return requestOptions
}

function createHttpClient(): HttpClient {
  const token = process.env['ACTIONS_RUNTIME_TOKEN'] || ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)

  return new HttpClient(
    'actions/cache',
    [bearerCredentialHandler],
    getRequestOptions()
  )
}

export function getCacheVersion(
  paths: string[],
  compressionMethod?: CompressionMethod
): string {
  const components = paths.concat(
    !compressionMethod || compressionMethod === CompressionMethod.Gzip
      ? []
      : [compressionMethod]
  )

  // Add salt to cache version to support breaking changes in cache entry
  components.push(versionSalt)

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
}

interface _content {
  Key?: string,
  LastModified?: Date,
}

async function getCacheEntryS3(
  s3Options: S3ClientConfig,
  s3BucketName: string,
  keys: string[],
  paths: string[],
): Promise<ArtifactCacheEntry | null> {
  const primaryKey = keys[0]

  const s3client = new S3Client(s3Options)
  const param = {
    Bucket: s3BucketName
  } as ListObjectsV2CommandInput

  let contents: _content[] = new Array();
  let hasNext: boolean = true

  while (hasNext) {
    const response = await s3client.send(new ListObjectsV2Command(param))
    if (!response.Contents) {
      throw new Error(`Cannot found object in bucket ${s3BucketName}`)
    }

    const found = response.Contents.find((content: _Object) => content.Key === primaryKey)
    if (found && found.LastModified) {
      return {
        cacheKey: primaryKey,
        creationTime: found.LastModified.toString()
      }
    }

    hasNext = response.IsTruncated ?? false

    response.Contents.map((obj: _Object) =>
      contents.push({
        Key: obj.Key,
        LastModified: obj.LastModified
      })
    )
  }

  // not found in primary key, So fallback to next keys
  const notPrimaryKey = keys.slice(1)
  for (const c of contents) {
    for (const k of notPrimaryKey) {
      if (c.Key === k) {
        return {
          cacheKey: k,
          creationTime: c.LastModified?.toString()
        }
      }
    }
  }

  return null
}

export async function getCacheEntry(
  keys: string[],
  paths: string[],
  options?: InternalCacheOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<ArtifactCacheEntry | null> {
  if (s3Options && s3BucketName) {
    return await getCacheEntryS3(s3Options, s3BucketName, keys, paths)
  }

  const httpClient = createHttpClient()
  const version = getCacheVersion(paths, options?.compressionMethod)
  const resource = `cache?keys=${encodeURIComponent(
    keys.join(',')
  )}&version=${version}`

  const response = await retryTypedResponse('getCacheEntry', async () =>
    httpClient.getJson<ArtifactCacheEntry>(getCacheApiUrl(resource))
  )
  if (response.statusCode === 204) {
    return null
  }
  if (!isSuccessStatusCode(response.statusCode)) {
    throw new Error(`Cache service responded with ${response.statusCode}`)
  }

  const cacheResult = response.result
  const cacheDownloadUrl = cacheResult?.archiveLocation
  if (!cacheDownloadUrl) {
    throw new Error('Cache not found.')
  }
  core.setSecret(cacheDownloadUrl)
  core.debug(`Cache Result:`)
  core.debug(JSON.stringify(cacheResult))

  return cacheResult
}

export async function downloadCache(
  cacheEntry: ArtifactCacheEntry,
  archivePath: string,
  options?: DownloadOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<void> {
  const archiveLocation = cacheEntry.archiveLocation ?? "https://example.com" // for dummy
  const archiveUrl = new URL(archiveLocation)
  const downloadOptions = getDownloadOptions(options)

  if (
    downloadOptions.useAzureSdk &&
    archiveUrl.hostname.endsWith('.blob.core.windows.net')
  ) {
    // Use Azure storage SDK to download caches hosted on Azure to improve speed and reliability.
    await downloadCacheStorageSDK(archiveLocation, archivePath, downloadOptions)
  } if (s3Options && s3BucketName && cacheEntry.cacheKey) {
    await downloadCacheStorageS3(
      cacheEntry.cacheKey,
      archivePath,
      s3Options,
      s3BucketName
    )
  } else {
    // Otherwise, download using the Actions http-client.
    await downloadCacheHttpClient(archiveLocation, archivePath)
  }
}

// Reserve Cache
export async function reserveCache(
  key: string,
  paths: string[],
  options?: InternalCacheOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<number> {
  if (s3Options && s3BucketName) {
    return 0
  }

  const httpClient = createHttpClient()
  const version = getCacheVersion(paths, options?.compressionMethod)

  const reserveCacheRequest: ReserveCacheRequest = {
    key,
    version
  }
  const response = await retryTypedResponse('reserveCache', async () =>
    httpClient.postJson<ReserveCacheResponse>(
      getCacheApiUrl('caches'),
      reserveCacheRequest
    )
  )
  return response?.result?.cacheId ?? -1
}

function getContentRange(start: number, end: number): string {
  // Format: `bytes start-end/filesize
  // start and end are inclusive
  // filesize can be *
  // For a 200 byte chunk starting at byte 0:
  // Content-Range: bytes 0-199/*
  return `bytes ${start}-${end}/*`
}

async function uploadChunk(
  httpClient: HttpClient,
  resourceUrl: string,
  openStream: () => NodeJS.ReadableStream,
  start: number,
  end: number,
): Promise<void> {
  core.debug(
    `Uploading chunk of size ${end -
      start +
      1} bytes at offset ${start} with content range: ${getContentRange(
      start,
      end
    )}`
  )
  const additionalHeaders = {
    'Content-Type': 'application/octet-stream',
    'Content-Range': getContentRange(start, end)
  }

  const uploadChunkResponse = await retryHttpClientResponse(
    `uploadChunk (start: ${start}, end: ${end})`,
    async () =>
      httpClient.sendStream(
        'PATCH',
        resourceUrl,
        openStream(),
        additionalHeaders
      )
  )

  if (!isSuccessStatusCode(uploadChunkResponse.message.statusCode)) {
    throw new Error(
      `Cache service responded with ${uploadChunkResponse.message.statusCode} during upload chunk.`
    )
  }
}

async function uploadFileS3(
  s3options: S3ClientConfig,
  s3BucketName: string,
  archivePath: string,
  key: string,
  concurrency: number,
  maxChunkSize: number,
): Promise<void> {
  core.debug(`Start upload to S3 (bucket: ${s3BucketName})`)

  const fileStream = fs.createReadStream(archivePath)

  try {
    const parallelUpload = new Upload({
      client: new S3Client(s3options),
      queueSize: concurrency,
      partSize: maxChunkSize,
  
      params: {
        Bucket: s3BucketName,
        Key: key,
        Body: fileStream
      }
    })
  
    parallelUpload.on("httpUploadProgress", (progress: Progress) => {
      core.debug(`Uploading chunk progress: ${JSON.stringify(progress)}`)
    })
  
    await parallelUpload.done()
  } catch (error) {
    throw new Error(
      `Cache upload failed because ${error}`
    )
  }

  return
}

async function uploadFile(
  httpClient: HttpClient,
  cacheId: number,
  archivePath: string,
  key: string,
  options?: UploadOptions,
  s3options?: S3ClientConfig,
  s3BucketName?: string
): Promise<void> {
  // Upload Chunks
  const uploadOptions = getUploadOptions(options)

  const concurrency = utils.assertDefined(
    'uploadConcurrency',
    uploadOptions.uploadConcurrency
  )
  const maxChunkSize = utils.assertDefined(
    'uploadChunkSize',
    uploadOptions.uploadChunkSize
  )

  const parallelUploads = [...new Array(concurrency).keys()]
  core.debug('Awaiting all uploads')
  let offset = 0

  if (s3options && s3BucketName) {
    await uploadFileS3(
      s3options,
      s3BucketName,
      archivePath,
      key,
      concurrency,
      maxChunkSize,
    )
    return
  }

  const fileSize = utils.getArchiveFileSizeInBytes(archivePath)
  const resourceUrl = getCacheApiUrl(`caches/${cacheId.toString()}`)
  const fd = fs.openSync(archivePath, 'r')
  try {
    await Promise.all(
      parallelUploads.map(async () => {
        while (offset < fileSize) {
          const chunkSize = Math.min(fileSize - offset, maxChunkSize)
          const start = offset
          const end = offset + chunkSize - 1
          offset += maxChunkSize

          await uploadChunk(
            httpClient,
            resourceUrl,
            () =>
              fs
                .createReadStream(archivePath, {
                  fd,
                  start,
                  end,
                  autoClose: false
                })
                .on('error', error => {
                  throw new Error(
                    `Cache upload failed because file read failed with ${error.message}`
                  )
                }),
            start,
            end
          )
        }
      })
    )
  } finally {
    fs.closeSync(fd)
  }
  return
}

async function commitCache(
  httpClient: HttpClient,
  cacheId: number,
  filesize: number
): Promise<ITypedResponse<null>> {
  const commitCacheRequest: CommitCacheRequest = {size: filesize}
  return await retryTypedResponse('commitCache', async () =>
    httpClient.postJson<null>(
      getCacheApiUrl(`caches/${cacheId.toString()}`),
      commitCacheRequest
    )
  )
}

export async function saveCache(
  cacheId: number,
  archivePath: string,
  key: string,
  options?: UploadOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<void> {
  const httpClient = createHttpClient()

  core.debug('Upload cache')
  await uploadFile(httpClient, cacheId, archivePath, key, options, s3Options, s3BucketName)

  // Commit Cache
  core.debug('Commiting cache')
  const cacheSize = utils.getArchiveFileSizeInBytes(archivePath)
  core.info(
    `Cache Size: ~${Math.round(cacheSize / (1024 * 1024))} MB (${cacheSize} B)`
  )

  if (!s3Options) { // already commit on S3
    const commitCacheResponse = await commitCache(httpClient, cacheId, cacheSize)
    if (!isSuccessStatusCode(commitCacheResponse.statusCode)) {
      throw new Error(
        `Cache service responded with ${commitCacheResponse.statusCode} during commit cache.`
      )
    }
  }

  core.info('Cache saved successfully')
}
