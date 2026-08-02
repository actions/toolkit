import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {
  RequestOptions,
  TypedResponse
} from '@actions/http-client/lib/interfaces'
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'
import * as utils from './cacheUtils.js'
import {
  ArtifactCacheEntry,
  InternalCacheOptions,
  CommitCacheRequest,
  ReserveCacheRequest,
  ReserveCacheResponse,
  ITypedResponseWithError,
  ArtifactCacheList
} from './contracts.js'
import {DownloadOptions, UploadOptions} from '../options.js'
import {isSuccessStatusCode, retryTypedResponse} from './requestUtils.js'
import {getCacheServiceURL} from './config.js'
import {CacheReadDeniedMessagePrefix} from './constants.js'
import {getUserAgentString} from './shared/user-agent.js'
import {getS3CacheConfiguration} from './s3CacheConfig.js'

function getCacheApiUrl(resource: string): string {
  const baseUrl: string = getCacheServiceURL()
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

function getRequestOptions(): RequestOptions {
  const requestOptions: RequestOptions = {
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
    getUserAgentString(),
    [bearerCredentialHandler],
    getRequestOptions()
  )
}

export async function getCacheEntry(
  keys: string[],
  paths: string[],
  options?: InternalCacheOptions
): Promise<ArtifactCacheEntry | null> {
  const httpClient = createHttpClient()
  const version = utils.getCacheVersion(
    paths,
    options?.compressionMethod,
    options?.enableCrossOsArchive
  )

  const resource = `cache?keys=${encodeURIComponent(
    keys.join(',')
  )}&version=${version}`

  const response = await retryTypedResponse('getCacheEntry', async () =>
    httpClient.getJson<ArtifactCacheEntry>(getCacheApiUrl(resource))
  )
  // Cache not found
  if (response.statusCode === 204) {
    // List cache for primary key only if cache miss occurs
    if (core.isDebug()) {
      await printCachesListForDiagnostics(keys[0], httpClient, version)
    }
    return null
  }
  if (!isSuccessStatusCode(response.statusCode)) {
    // Only surface the receiver's body for a `cache read denied:` policy denial
    // so callers can dispatch on it; keep the generic message otherwise.
    const errorMessage = response.error?.message
    if (errorMessage?.includes(CacheReadDeniedMessagePrefix)) {
      throw new Error(errorMessage)
    }
    throw new Error(`Cache service responded with ${response.statusCode}`)
  }

  const cacheResult = response.result
  const cacheDownloadUrl = cacheResult?.archiveLocation
  if (!cacheDownloadUrl) {
    // Cache achiveLocation not found. This should never happen, and hence bail out.
    throw new Error('Cache not found.')
  }
  core.setSecret(cacheDownloadUrl)
  core.debug(`Cache Result:`)
  core.debug(JSON.stringify(cacheResult))

  return cacheResult
}

async function printCachesListForDiagnostics(
  key: string,
  httpClient: HttpClient,
  version: string
): Promise<void> {
  const resource = `caches?key=${encodeURIComponent(key)}`
  const response = await retryTypedResponse('listCache', async () =>
    httpClient.getJson<ArtifactCacheList>(getCacheApiUrl(resource))
  )
  if (response.statusCode === 200) {
    const cacheListResult = response.result
    const totalCount = cacheListResult?.totalCount
    if (totalCount && totalCount > 0) {
      core.debug(
        `No matching cache found for cache key '${key}', version '${version} and scope ${process.env['GITHUB_REF']}. There exist one or more cache(s) with similar key but they have different version or scope. See more info on cache matching here: https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#matching-a-cache-key \nOther caches with similar key:`
      )
      for (const cacheEntry of cacheListResult?.artifactCaches || []) {
        core.debug(
          `Cache Key: ${cacheEntry?.cacheKey}, Cache Version: ${cacheEntry?.cacheVersion}, Cache Scope: ${cacheEntry?.scope}, Cache Created: ${cacheEntry?.creationTime}`
        )
      }
    }
  }
}

export async function downloadCache(
  archiveLocation: string,
  archivePath: string,
  _options?: DownloadOptions
): Promise<void> {
  void archiveLocation
  void _options
  const {bucket, objectKey, s3ClientConfig} = getS3CacheConfiguration()
  const client = new S3Client(s3ClientConfig)

  try {
    const response = await client.send(
      new GetObjectCommand({Bucket: bucket, Key: objectKey})
    )
    if (!(response.Body instanceof stream.Readable)) {
      throw new Error(
        'S3 cache download response did not contain a readable body.'
      )
    }

    await util.promisify(stream.pipeline)(
      response.Body,
      fs.createWriteStream(archivePath)
    )
  } finally {
    client.destroy()
  }
}

// Reserve Cache
export async function reserveCache(
  key: string,
  paths: string[],
  options?: InternalCacheOptions
): Promise<ITypedResponseWithError<ReserveCacheResponse>> {
  const httpClient = createHttpClient()
  const version = utils.getCacheVersion(
    paths,
    options?.compressionMethod,
    options?.enableCrossOsArchive
  )

  const reserveCacheRequest: ReserveCacheRequest = {
    key,
    version,
    cacheSize: options?.cacheSize
  }
  const response = await retryTypedResponse('reserveCache', async () =>
    httpClient.postJson<ReserveCacheResponse>(
      getCacheApiUrl('caches'),
      reserveCacheRequest
    )
  )
  return response
}

async function commitCache(
  httpClient: HttpClient,
  cacheId: number,
  filesize: number
): Promise<TypedResponse<null>> {
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
  signedUploadUrl?: string,
  options?: UploadOptions
): Promise<void> {
  void options
  const {bucket, objectKey, s3ClientConfig} = getS3CacheConfiguration()
  const client = new S3Client(s3ClientConfig)

  try {
    core.debug('Upload cache to S3')
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: fs.createReadStream(archivePath)
      })
    )
  } finally {
    client.destroy()
  }

  // v2 finalizes uploads through Twirp. v1 still requires the legacy commit.
  if (!signedUploadUrl) {
    const httpClient = createHttpClient()
    const cacheSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.debug('Commiting cache')
    core.info(
      `Cache Size: ~${Math.round(
        cacheSize / (1024 * 1024)
      )} MB (${cacheSize} B)`
    )

    const commitCacheResponse = await commitCache(
      httpClient,
      cacheId,
      cacheSize
    )
    if (!isSuccessStatusCode(commitCacheResponse.statusCode)) {
      throw new Error(
        `Cache service responded with ${commitCacheResponse.statusCode} during commit cache.`
      )
    }

    core.info('Cache saved successfully')
  }
}
