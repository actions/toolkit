import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  PushEvent,
  PullRequestEvent,
  WorkflowDispatchEvent
} from '@octokit/webhooks-definitions/schema'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {
  RequestOptions,
  TypedResponse
} from '@actions/http-client/lib/interfaces'
import * as crypto from 'crypto'

import * as utils from './cacheUtils'
import {CompressionMethod} from './constants'
import os from 'os'
import {
  InternalCacheOptions,
  ITypedResponseWithError,
  InternalS3CompletedPart
} from './contracts'
import {
  downloadCacheGCP,
  downloadCacheMultiConnection,
  downloadCacheMultipartGCP,
  downloadCacheStreamingGCP
} from './downloadUtils'
import {isSuccessStatusCode, retryTypedResponse} from './requestUtils'
import {Storage} from '@google-cloud/storage'
import {
  CommonsCommitCacheRequest,
  CommonsCommitCacheResponse,
  CommonsDeleteCacheResponse,
  CommonsGetCacheResponse,
  CommonsReserveCacheRequest,
  CommonsReserveCacheResponse
} from './warpcache-ts-sdk'
import {multiPartUploadToGCS, uploadFileToS3} from './uploadUtils'
import {CommonsGetCacheRequest} from './warpcache-ts-sdk/models/commons-get-cache-request'
import {CommonsDeleteCacheRequest} from './warpcache-ts-sdk/models/commons-delete-cache-request'
import {OAuth2Client} from 'google-auth-library'

const versionSalt = '1.0'

function getCacheApiUrl(resource: string): string {
  const baseUrl: string =
    process.env['WARPBUILD_CACHE_URL'] ?? 'https://cache.warpbuild.com'
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

function getVCSRepository(): string {
  const vcsRepository = process.env['GITHUB_REPOSITORY'] ?? ''
  return vcsRepository
}

function getVCSRef(): string {
  const vcsBranch = process.env['GITHUB_REF'] ?? ''
  return vcsBranch
}

function getAnnotations(): {[key: string]: string} {
  const annotations: {[key: string]: string} = {
    GITHUB_WORKFLOW: process.env['GITHUB_WORKFLOW'] ?? '',
    GITHUB_RUN_ID: process.env['GITHUB_RUN_ID'] ?? '',
    GITHUB_RUN_ATTEMPT: process.env['GITHUB_RUN_ATTEMPT'] ?? '',
    GITHUB_JOB: process.env['GITHUB_JOB'] ?? '',
    GITHUB_REPOSITORY: process.env['GITHUB_REPOSITORY'] ?? '',
    GITHUB_REF: process.env['GITHUB_REF'] ?? '',
    GITHUB_ACTION: process.env['GITHUB_ACTION'] ?? '',
    RUNNER_NAME: process.env['RUNNER_NAME'] ?? ''
  }
  return annotations
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
  const token = process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN'] ?? ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)

  return new HttpClient(
    'warp/cache',
    [bearerCredentialHandler],
    getRequestOptions()
  )
}

export function getCacheVersion(
  paths: string[],
  compressionMethod?: CompressionMethod,
  enableCrossOsArchive = false,
  enableCrossArchArchive = false
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

  // Add architecture to cache version
  if (!enableCrossArchArchive) {
    components.push(process.arch)
  }

  // Add salt to cache version to support breaking changes in cache entry
  components.push(versionSalt)

  return crypto.createHash('sha256').update(components.join('|')).digest('hex')
}

export async function getCacheEntry(
  key: string,
  restoreKeys: string[],
  paths: string[],
  options?: InternalCacheOptions
): Promise<CommonsGetCacheResponse | null> {
  const httpClient = createHttpClient()
  const version = getCacheVersion(
    paths,
    options?.compressionMethod,
    options?.enableCrossOsArchive,
    options?.enableCrossArchArchive
  )

  const restoreBranches: Array<string> = []
  const restoreRepos: Array<string> = []

  switch (github.context.eventName) {
    case 'pull_request':
      {
        const pullPayload = github.context.payload as PullRequestEvent
        restoreBranches.push(
          `refs/heads/${pullPayload?.pull_request?.head?.ref}`
        )

        // If head points to a different repository, add it to restoreRepos. We allow restores from head repos as well.
        if (
          pullPayload?.pull_request?.head?.repo?.name !==
          pullPayload?.repository?.name
        ) {
          restoreRepos.push(pullPayload?.pull_request?.head?.repo?.name)
        }
      }
      break
    case 'push':
    case 'workflow_dispatch':
      {
        const pushPayload = github.context.payload as PushEvent
        // Default branch is not in the complete format
        // Ref: https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
        restoreBranches.push(
          `refs/heads/${pushPayload?.repository?.default_branch}`
        )
      }
      break
    default:
      break
  }

  const getCacheRequest: CommonsGetCacheRequest = {
    cache_key: key,
    restore_keys: restoreKeys,
    cache_version: version,
    vcs_repository: getVCSRepository(),
    vcs_ref: getVCSRef(),
    annotations: getAnnotations(),
    restore_branches: restoreBranches,
    restore_repos: restoreRepos
  }

  const response = await retryTypedResponse('getCacheEntry', async () =>
    httpClient.postJson<CommonsGetCacheResponse>(
      getCacheApiUrl('cache/get'),
      getCacheRequest
    )
  )

  if (response.statusCode === 204) {
    // TODO: List cache for primary key only if cache miss occurs
    // if (core.isDebug()) {
    //   await printCachesListForDiagnostics(keys[0], httpClient, version)
    // }
    return null
  }
  if (!isSuccessStatusCode(response.statusCode)) {
    throw new Error(`Cache service responded with ${response.statusCode}`)
  }

  const cacheResult = response.result
  core.debug(`Cache Result:`)
  core.debug(JSON.stringify(cacheResult))

  return cacheResult
}

/*
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
*/

export async function downloadCache(
  provider: string,
  archiveLocation: string,
  archivePath: string,
  gcsToken?: string
): Promise<void> {
  switch (provider) {
    case 's3':
      {
        const numberOfConnections = 2 + os.cpus().length
        await downloadCacheMultiConnection(
          archiveLocation,
          archivePath,
          Math.min(numberOfConnections, 30)
        )
      }
      break
    case 'gcs': {
      if (!gcsToken) {
        throw new Error(
          'Unable to download cache from GCS. GCP token is not provided.'
        )
      }

      const oauth2Client = new OAuth2Client()
      oauth2Client.setCredentials({access_token: gcsToken})
      const storage = new Storage({
        authClient: oauth2Client
      })
      await downloadCacheMultipartGCP(storage, archiveLocation, archivePath)
      break
    }
  }
}

export async function downloadCacheSingleThread(
  provider: string,
  archiveLocation: string,
  archivePath: string,
  gcsToken?: string
): Promise<void> {
  switch (provider) {
    case 's3':
      break
    case 'gcs': {
      if (!gcsToken) {
        throw new Error(
          'Unable to download cache from GCS. GCP token is not provided.'
        )
      }

      const oauth2Client = new OAuth2Client()
      oauth2Client.setCredentials({access_token: gcsToken})
      const storage = new Storage({
        authClient: oauth2Client,
        retryOptions: {
          autoRetry: false,
          maxRetries: 1
        }
      })
      await downloadCacheGCP(storage, archiveLocation, archivePath)
      break
    }
  }
}

export function downloadCacheStreaming(
  provider: string,
  archiveLocation: string,
  gcsToken?: string
): NodeJS.ReadableStream | undefined {
  switch (provider) {
    case 's3':
      return undefined
    case 'gcs': {
      if (!gcsToken) {
        throw new Error(
          'Unable to download cache from GCS. GCP token is not provided.'
        )
      }
      const oauth2Client = new OAuth2Client()
      oauth2Client.setCredentials({access_token: gcsToken})
      const storage = new Storage({
        authClient: oauth2Client
      })
      return downloadCacheStreamingGCP(storage, archiveLocation)
    }
    default:
      return undefined
  }
}

export async function reserveCache(
  cacheKey: string,
  numberOfChunks: number,
  cacheVersion: string
): Promise<ITypedResponseWithError<CommonsReserveCacheResponse>> {
  const httpClient = createHttpClient()

  const reserveCacheRequest: CommonsReserveCacheRequest = {
    cache_key: cacheKey,
    cache_version: cacheVersion,
    number_of_chunks: numberOfChunks,
    content_type: 'application/zstd',
    vcs_repository: getVCSRepository(),
    vcs_ref: getVCSRef(),
    annotations: getAnnotations()
  }
  const response = await retryTypedResponse('reserveCache', async () =>
    httpClient.postJson<CommonsReserveCacheResponse>(
      getCacheApiUrl('cache/reserve'),
      reserveCacheRequest
    )
  )
  return response
}

async function commitCache(
  cacheKey: string,
  cacheVersion: string,
  uploadKey?: string,
  uploadID?: string,
  parts?: InternalS3CompletedPart[]
): Promise<TypedResponse<CommonsCommitCacheResponse>> {
  const httpClient = createHttpClient()

  if (!parts) {
    parts = []
  }

  const commitCacheRequest: CommonsCommitCacheRequest = {
    cache_key: cacheKey,
    cache_version: cacheVersion,
    upload_key: uploadKey,
    upload_id: uploadID,
    parts: parts,
    vcs_type: 'github',
    vcs_repository: getVCSRepository(),
    vcs_ref: getVCSRef(),
    annotations: getAnnotations()
  }
  return await retryTypedResponse('commitCache', async () =>
    httpClient.postJson<CommonsCommitCacheResponse>(
      getCacheApiUrl(`cache/commit`),
      commitCacheRequest
    )
  )
}

export async function saveCache(
  provider: string,
  cacheKey: string,
  cacheVersion: string,
  archivePath: string,
  S3UploadId?: string,
  S3UploadKey?: string,
  S3NumberOfChunks?: number,
  S3PreSignedURLs?: string[],
  GCSAuthToken?: string,
  GCSBucketName?: string,
  GCSObjectName?: string
): Promise<string> {
  const cacheSize = utils.getArchiveFileSizeInBytes(archivePath)
  core.info(
    `Cache Size: ~${Math.round(cacheSize / (1024 * 1024))} MB (${cacheSize} B)`
  )

  let commitCacheResponse: TypedResponse<CommonsCommitCacheResponse> = {
    headers: {},
    statusCode: 0,
    result: null
  }

  let cacheKeyResponse = ''

  switch (provider) {
    case 's3': {
      if (
        !S3NumberOfChunks ||
        !S3PreSignedURLs ||
        !S3UploadId ||
        !S3UploadKey
      ) {
        core.debug(
          `S3 params are not set. Number of Chunks: ${S3NumberOfChunks}, PreSigned URLs: ${S3PreSignedURLs}, Upload ID: ${S3UploadId}, Upload Key: ${S3UploadKey}`
        )
        throw new Error(
          'Unable to upload cache to S3. One of the following required parameters is missing: numberOfChunks, preSignedURLs, uploadId, uploadKey.'
        )
      }

      // Number of chunks should match the number of pre-signed URLs
      if (S3NumberOfChunks !== S3PreSignedURLs.length) {
        throw new Error(
          `Number of chunks (${S3NumberOfChunks}) should match the number of pre-signed URLs (${S3PreSignedURLs.length}).`
        )
      }

      core.debug('Uploading cache')
      const completedParts = await uploadFileToS3(S3PreSignedURLs, archivePath)

      // Sort parts in ascending order by partNumber
      completedParts.sort((a, b) => a.PartNumber - b.PartNumber)

      core.debug('Committing cache')
      commitCacheResponse = await commitCache(
        cacheKey,
        cacheVersion,
        S3UploadKey,
        S3UploadId,
        completedParts
      )

      cacheKeyResponse =
        commitCacheResponse.result?.cache_entry?.cache_user_given_key ??
        commitCacheResponse.result?.s3?.cache_key ??
        ''

      break
    }

    case 'gcs': {
      if (!GCSBucketName || !GCSObjectName || !GCSAuthToken) {
        throw new Error(
          'Unable to upload cache to GCS. One of the following required parameters is missing: GCSBucketName, GCSObjectName, GCSAuthToken.'
        )
      }

      core.debug('Uploading cache')
      const oauth2Client = new OAuth2Client()
      oauth2Client.setCredentials({access_token: GCSAuthToken})
      const storage = new Storage({
        authClient: oauth2Client
      })
      await multiPartUploadToGCS(
        storage,
        archivePath,
        GCSBucketName,
        GCSObjectName
      )

      core.debug('Committing cache')
      commitCacheResponse = await commitCache(cacheKey, cacheVersion)

      cacheKeyResponse =
        commitCacheResponse.result?.cache_entry?.cache_user_given_key ??
        commitCacheResponse.result?.gcs?.cache_key ??
        ''
      break
    }
  }

  if (!isSuccessStatusCode(commitCacheResponse.statusCode)) {
    throw new Error(
      `Cache service responded with ${commitCacheResponse.statusCode} during commit cache.`
    )
  }

  core.info('Cache saved successfully')
  return cacheKeyResponse
}

export async function deleteCache(cacheKey: string, cacheVersion: string) {
  const httpClient = createHttpClient()

  const deleteCacheRequest: CommonsDeleteCacheRequest = {
    cache_key: cacheKey,
    cache_version: cacheVersion,
    vcs_repository: getVCSRepository(),
    vcs_ref: getVCSRef(),
    annotations: getAnnotations()
  }

  const response = await retryTypedResponse('deleteCacheEntry', async () =>
    httpClient.postJson<CommonsDeleteCacheResponse>(
      getCacheApiUrl('cache/delete'),
      deleteCacheRequest
    )
  )

  if (!isSuccessStatusCode(response.statusCode)) {
    throw new Error(`Cache service responded with ${response.statusCode}`)
  }
}
