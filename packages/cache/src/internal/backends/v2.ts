import * as core from '@actions/core'
import * as path from 'path'
import * as utils from '../cacheUtils.js'
import * as cacheHttpClient from '../cacheHttpClient.js'
import * as cacheTwirpClient from '../shared/cacheTwirpClient.js'
import {DownloadOptions, UploadOptions} from '../../options.js'
import {createTar, extractTar, listTar} from '../tar.js'
import {
  CreateCacheEntryRequest,
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  GetCacheEntryDownloadURLRequest
} from '../../generated/results/api/v1/cache.js'
import {HttpClientError} from '@actions/http-client'
import {
  CACHE_READ_DENIED_PREFIX,
  CACHE_WRITE_DENIED_PREFIX,
  CacheReadDeniedError,
  CacheWriteDeniedError,
  FinalizeCacheError,
  ReserveCacheError,
  ValidationError
} from '../errors.js'
import {checkKey} from '../validation.js'
import {CacheBackend} from './backend.js'

export const v2Backend: CacheBackend = {
  isAvailable: () => !!process.env['ACTIONS_RESULTS_URL'],
  restoreCache: restoreCacheV2,
  saveCache: saveCacheV2
}

/**
 * Restores cache using Cache Service v2
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache. Lookup is done with prefix matching
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for primaryKey
 * @param downloadOptions cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on windows any cache created on any platform
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
async function restoreCacheV2(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false
): Promise<string | undefined> {
  // Override UploadOptions to force the use of Azure
  options = {
    ...options,
    useAzureSdk: true
  }
  restoreKeys = restoreKeys || []
  const keys = [primaryKey, ...restoreKeys]

  core.debug('Resolved Keys:')
  core.debug(JSON.stringify(keys))

  if (keys.length > 10) {
    throw new ValidationError(
      `Key Validation Error: Keys are limited to a maximum of 10.`
    )
  }
  for (const key of keys) {
    checkKey(key)
  }

  let archivePath = ''
  try {
    const twirpClient = cacheTwirpClient.internalCacheTwirpClient()
    const compressionMethod = await utils.getCompressionMethod()

    const request: GetCacheEntryDownloadURLRequest = {
      key: primaryKey,
      restoreKeys,
      version: utils.getCacheVersion(
        paths,
        compressionMethod,
        enableCrossOsArchive
      )
    }

    let response
    try {
      response = await twirpClient.GetCacheEntryDownloadURL(request)
    } catch (error) {
      // The receiver returns twirp PermissionDenied (403) when the run's token
      // has no readable cache scopes. The client wraps that 403, so the stable
      // prefix is embedded in the message rather than leading it.
      const errorMessage = (error as Error)?.message ?? ''
      if (errorMessage.includes(CACHE_READ_DENIED_PREFIX)) {
        throw new CacheReadDeniedError(errorMessage)
      }
      throw error
    }

    if (!response.ok) {
      core.debug(
        `Cache not found for version ${request.version} of keys: ${keys.join(
          ', '
        )}`
      )
      return undefined
    }

    const isRestoreKeyMatch = request.key !== response.matchedKey
    if (isRestoreKeyMatch) {
      core.info(`Cache hit for restore-key: ${response.matchedKey}`)
    } else {
      core.info(`Cache hit for: ${response.matchedKey}`)
    }

    if (options?.lookupOnly) {
      core.info('Lookup only - skipping download')
      return response.matchedKey
    }

    archivePath = path.join(
      await utils.createTempDirectory(),
      utils.getCacheFileName(compressionMethod)
    )
    core.debug(`Archive path: ${archivePath}`)
    core.debug(`Starting download of archive to: ${archivePath}`)

    await cacheHttpClient.downloadCache(
      response.signedDownloadUrl,
      archivePath,
      options
    )

    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.info(
      `Cache Size: ~${Math.round(
        archiveFileSize / (1024 * 1024)
      )} MB (${archiveFileSize} B)`
    )

    if (core.isDebug()) {
      await listTar(archivePath, compressionMethod)
    }

    await extractTar(archivePath, compressionMethod)
    core.info('Cache restored successfully')

    return response.matchedKey
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else {
      // Suppress all non-validation cache related errors because caching should be optional
      // Log server errors (5xx) as errors, all other errors as warnings.
      // A read denied by policy (CacheReadDeniedError) is not an HttpClientError
      // so it falls here and is warned, treated as a cache miss.
      if (
        typedError instanceof HttpClientError &&
        typeof typedError.statusCode === 'number' &&
        typedError.statusCode >= 500
      ) {
        core.error(`Failed to restore: ${(error as Error).message}`)
      } else {
        core.warning(`Failed to restore: ${(error as Error).message}`)
      }
    }
  } finally {
    try {
      if (archivePath) {
        await utils.unlinkFile(archivePath)
      }
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }

  return undefined
}

/**
 * Save cache using Cache Service v2
 *
 * @param paths a list of file paths to restore from the cache
 * @param key an explicit key for restoring the cache
 * @param options cache upload options
 * @param enableCrossOsArchive an optional boolean enabled to save cache on windows which could be restored on any platform
 * @returns
 */
async function saveCacheV2(
  paths: string[],
  key: string,
  options?: UploadOptions,
  enableCrossOsArchive = false
): Promise<number> {
  // Override UploadOptions to force the use of Azure
  // ...options goes first because we want to override the default values
  // set in UploadOptions with these specific figures
  options = {
    ...options,
    uploadChunkSize: 64 * 1024 * 1024, // 64 MiB
    uploadConcurrency: 8, // 8 workers for parallel upload
    useAzureSdk: true
  }
  const compressionMethod = await utils.getCompressionMethod()
  const twirpClient = cacheTwirpClient.internalCacheTwirpClient()
  let cacheId = -1

  const cachePaths = await utils.resolvePaths(paths)
  core.debug('Cache Paths:')
  core.debug(`${JSON.stringify(cachePaths)}`)

  if (cachePaths.length === 0) {
    throw new Error(
      `Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`
    )
  }

  const archiveFolder = await utils.createTempDirectory()
  const archivePath = path.join(
    archiveFolder,
    utils.getCacheFileName(compressionMethod)
  )

  core.debug(`Archive Path: ${archivePath}`)

  try {
    await createTar(archiveFolder, cachePaths, compressionMethod)
    if (core.isDebug()) {
      await listTar(archivePath, compressionMethod)
    }

    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.debug(`File Size: ${archiveFileSize}`)

    // Set the archive size in the options, will be used to display the upload progress
    options.archiveSizeBytes = archiveFileSize

    core.debug('Reserving Cache')
    const version = utils.getCacheVersion(
      paths,
      compressionMethod,
      enableCrossOsArchive
    )
    const request: CreateCacheEntryRequest = {
      key,
      version
    }

    let signedUploadUrl

    try {
      const response = await twirpClient.CreateCacheEntry(request)
      if (!response.ok) {
        // Skip the redundant inner warning when the receiver signalled a
        // policy denial: the outer catch arm below will log a single
        // customer-facing warning.
        if (
          response.message &&
          !response.message.startsWith(CACHE_WRITE_DENIED_PREFIX)
        ) {
          core.warning(`Cache reservation failed: ${response.message}`)
        }
        throw new Error(response.message || 'Response was not ok')
      }
      signedUploadUrl = response.signedUploadUrl
    } catch (error) {
      core.debug(`Failed to reserve cache: ${error}`)
      const errorMessage = (error as Error)?.message ?? ''
      if (errorMessage.startsWith(CACHE_WRITE_DENIED_PREFIX)) {
        throw new CacheWriteDeniedError(
          `Unable to reserve cache with key ${key}. More details: ${errorMessage}`
        )
      }
      throw new ReserveCacheError(
        `Unable to reserve cache with key ${key}, another job may be creating this cache.`
      )
    }

    core.debug(`Attempting to upload cache located at: ${archivePath}`)
    await cacheHttpClient.saveCache(
      cacheId,
      archivePath,
      signedUploadUrl,
      options
    )

    const finalizeRequest: FinalizeCacheEntryUploadRequest = {
      key,
      version,
      sizeBytes: `${archiveFileSize}`
    }

    const finalizeResponse: FinalizeCacheEntryUploadResponse =
      await twirpClient.FinalizeCacheEntryUpload(finalizeRequest)
    core.debug(`FinalizeCacheEntryUploadResponse: ${finalizeResponse.ok}`)

    if (!finalizeResponse.ok) {
      if (finalizeResponse.message) {
        throw new FinalizeCacheError(finalizeResponse.message)
      }
      throw new Error(
        `Unable to finalize cache with key ${key}, another job may be finalizing this cache.`
      )
    }

    cacheId = parseInt(finalizeResponse.entryId)
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else if (typedError.name === ReserveCacheError.name) {
      core.info(`Failed to save: ${typedError.message}`)
    } else if (typedError.name === FinalizeCacheError.name) {
      core.warning(typedError.message)
    } else {
      // Log server errors (5xx) as errors, all other errors as warnings.
      // A write denied by policy (CacheWriteDeniedError) is not an
      // HttpClientError and its name does not match the ReserveCacheError arm,
      // so it falls here and is warned without failing the run.
      if (
        typedError instanceof HttpClientError &&
        typeof typedError.statusCode === 'number' &&
        typedError.statusCode >= 500
      ) {
        core.error(`Failed to save: ${typedError.message}`)
      } else {
        core.warning(`Failed to save: ${typedError.message}`)
      }
    }
  } finally {
    // Try to delete the archive to save space
    try {
      await utils.unlinkFile(archivePath)
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }

  return cacheId
}
