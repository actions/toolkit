import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {
  RequestOptions,
  TypedResponse
} from '@actions/http-client/lib/interfaces'
import * as crypto from 'crypto'
import * as fs from 'fs'

import * as utils from './cacheUtils'
import {CompressionMethod} from './constants'
import {
  ArtifactCacheEntry,
  InternalCacheOptions,
  CommitCacheRequest,
  ReserveCacheRequest,
  ReserveCacheResponse,
  ITypedResponseWithError,
  ArtifactCacheList,
  InternalS3CompletedPart,
  CommitCacheResponse
} from './contracts'
import {downloadCacheMultiConnection} from './downloadUtils'
import {isSuccessStatusCode, retryTypedResponse} from './requestUtils'
import axios, {AxiosError} from 'axios'

const versionSalt = '1.0'

function getCacheApiUrl(resource: string): string {
  const baseUrl: string =
    process.env['WARP_CACHE_URL'] ?? 'https://cache.warpbuild.com'
  if (!baseUrl) {
    throw new Error('Cache Service Url not found, unable to restore cache.')
  }

  const url = `${baseUrl}/v1/${resource}`
  core.debug(`Resource Url: ${url}`)
  return url
}

function createAcceptHeader(type: string, apiVersion: string): string {
  return `${type};api-version=${apiVersion}`
}

function getRequestOptions(): RequestOptions {
  const requestOptions: RequestOptions = {
    headers: {
      Accept: createAcceptHeader('application/json', 'v1')
    }
  }

  return requestOptions
}

function createHttpClient(): HttpClient {
  const token = process.env['WARP_RUNNER_VERIFICATION_TOKEN'] ?? ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)

  return new HttpClient(
    'actions/cache',
    [bearerCredentialHandler],
    getRequestOptions()
  )
}

export function getCacheVersion(
  paths: string[],
  compressionMethod?: CompressionMethod,
  enableCrossOsArchive = false
): string {
  const components = paths

  // Add compression method to cache version to restore
  // compressed cache as per compression method
  if (compressionMethod) {
    components.push(compressionMethod)
  }

  // Only check for windows platforms if enableCrossOsArchive is false
  if (process.platform === 'win32' && !enableCrossOsArchive) {
    components.push('windows-only')
  }

  // Add salt to cache version to support breaking changes in cache entry
  components.push(versionSalt)

  return crypto.createHash('sha256').update(components.join('|')).digest('hex')
}

export async function getCacheEntry(
  keys: string[],
  paths: string[],
  options?: InternalCacheOptions
): Promise<ArtifactCacheEntry | null> {
  const httpClient = createHttpClient()
  const version = getCacheVersion(
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
    throw new Error(`Cache service responded with ${response.statusCode}`)
  }

  const cacheResult = response.result
  const cacheDownloadUrl = cacheResult?.pre_signed_url
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
      for (const cacheEntry of cacheListResult?.artifactCaches ?? []) {
        core.debug(
          `Cache Key: ${cacheEntry?.cache_key}, Cache Version: ${cacheEntry?.cache_version}`
        )
      }
    }
  }
}

export async function downloadCache(
  archiveLocation: string,
  archivePath: string
): Promise<void> {
  await downloadCacheMultiConnection(archiveLocation, archivePath, 8)
}

// Reserve Cache
export async function reserveCache(
  cacheKey: string,
  numberOfChunks: number,
  options?: InternalCacheOptions
): Promise<ITypedResponseWithError<ReserveCacheResponse>> {
  const httpClient = createHttpClient()

  const reserveCacheRequest: ReserveCacheRequest = {
    cache_key: cacheKey,
    number_of_chunks: numberOfChunks,
    content_type: 'application/zstd'
  }
  const response = await retryTypedResponse('reserveCache', async () =>
    httpClient.postJson<ReserveCacheResponse>(
      getCacheApiUrl('cache/reserve'),
      reserveCacheRequest
    )
  )
  return response
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
  resourceUrl: string,
  openStream: () => NodeJS.ReadableStream,
  partNumber: number,
  start: number,
  end: number
): Promise<InternalS3CompletedPart> {
  core.debug(
    `Uploading chunk of size ${
      end - start + 1
    } bytes at offset ${start} with content range: ${getContentRange(
      start,
      end
    )}`
  )

  // Manually convert the readable stream to a buffer. S3 doesn't allow stream as input
  const chunks = await utils.streamToBuffer(openStream())

  try {
    // HACK: Using axios here as S3 API doesn't allow readable stream as input and Github's HTTP client is not able to send buffer as body
    const response = await axios.request({
      method: 'PUT',
      url: resourceUrl,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      data: chunks
    })
    return {
      ETag: response.headers.etag ?? '',
      PartNumber: partNumber
    }
  } catch (error) {
    throw new Error(
      `Cache service responded with ${
        (error as AxiosError).status
      } during upload chunk.`
    )
  }
}

async function uploadFileToS3(
  preSignedURLs: string[],
  archivePath: string
): Promise<InternalS3CompletedPart[]> {
  // Upload Chunks
  const fileSize = utils.getArchiveFileSizeInBytes(archivePath)
  const numberOfChunks = preSignedURLs.length

  const fd = fs.openSync(archivePath, 'r')

  core.debug('Awaiting all uploads')
  let offset = 0

  try {
    const completedParts = await Promise.all(
      preSignedURLs.map(async (presignedURL, index) => {
        const chunkSize = Math.ceil(fileSize / numberOfChunks)
        const start = offset
        const end = offset + chunkSize - 1
        offset += chunkSize

        return await uploadChunk(
          presignedURL,
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
          index + 1,
          start,
          end
        )
      })
    )

    return completedParts
  } finally {
    fs.closeSync(fd)
  }
}

async function commitCache(
  httpClient: HttpClient,
  cacheKey: string,
  cacheVersion: string,
  uploadKey: string,
  uploadID: string,
  parts: InternalS3CompletedPart[]
): Promise<TypedResponse<CommitCacheResponse>> {
  const commitCacheRequest: CommitCacheRequest = {
    cache_key: cacheKey,
    cache_version: cacheVersion,
    upload_key: uploadKey,
    upload_id: uploadID,
    parts: parts,
    os: process.env['RUNNER_OS'] ?? 'Linux',
    vcs_type: 'github'
  }
  return await retryTypedResponse('commitCache', async () =>
    httpClient.postJson<CommitCacheResponse>(
      getCacheApiUrl(`cache/commit`),
      commitCacheRequest
    )
  )
}

export async function saveCache(
  cacheKey: string,
  cacheVersion: string,
  uploadId: string,
  uploadKey: string,
  numberOfChunks: number,
  preSignedURLs: string[],
  archivePath: string
): Promise<string> {
  // Number of chunks should match the number of pre-signed URLs
  if (numberOfChunks !== preSignedURLs.length) {
    throw new Error(
      `Number of chunks (${numberOfChunks}) should match the number of pre-signed URLs (${preSignedURLs.length}).`
    )
  }

  const httpClient = createHttpClient()

  core.debug('Upload cache')
  const completedParts = await uploadFileToS3(preSignedURLs, archivePath)

  // Sort parts in ascending order by partNumber
  completedParts.sort((a, b) => a.PartNumber - b.PartNumber)

  // Commit Cache
  core.debug('Committing cache')
  const cacheSize = utils.getArchiveFileSizeInBytes(archivePath)
  core.info(
    `Cache Size: ~${Math.round(cacheSize / (1024 * 1024))} MB (${cacheSize} B)`
  )

  const commitCacheResponse = await commitCache(
    httpClient,
    cacheKey,
    cacheVersion,
    uploadKey,
    uploadId,
    completedParts
  )
  if (!isSuccessStatusCode(commitCacheResponse.statusCode)) {
    throw new Error(
      `Cache service responded with ${commitCacheResponse.statusCode} during commit cache.`
    )
  }

  core.info('Cache saved successfully')
  return commitCacheResponse.result?.cache_key ?? ''
}

export async function deleteCache(keys: string[]) {
  const httpClient = createHttpClient()
  const resource = `cache?keys=${encodeURIComponent(keys.join(','))}`
  const response = await httpClient.del(getCacheApiUrl(resource))
  if (!isSuccessStatusCode(response.message.statusCode)) {
    throw new Error(
      `Cache service responded with ${response.message.statusCode}`
    )
  }
}
