import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import * as cacheTwirpClient from './internal/shared/cacheTwirpClient'
import {getCacheServiceVersion, isGhes} from './internal/config'
import {DownloadOptions, UploadOptions} from './options'
import {createTar, extractTar, listTar} from './internal/tar'
import {
  CreateCacheEntryRequest,
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  GetCacheEntryDownloadURLRequest
} from './generated/results/api/v1/cache'
import {CacheFileSizeLimit} from './internal/constants'
import {HttpClientError} from '@actions/http-client'
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class ReserveCacheError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReserveCacheError'
    Object.setPrototypeOf(this, ReserveCacheError.prototype)
  }
}

export class DeleteCacheError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeleteCacheError'
    Object.setPrototypeOf(this, DeleteCacheError.prototype)
  }
}

function checkPaths(paths: string[]): void {
  if (!paths || paths.length === 0) {
    throw new ValidationError(
      `Path Validation Error: At least one directory or file path is required`
    )
  }
}

function checkKey(key: string): void {
  if (key.length > 512) {
    throw new ValidationError(
      `Key Validation Error: ${key} cannot be larger than 512 characters.`
    )
  }
  const regex = /^[^,]*$/
  if (!regex.test(key)) {
    throw new ValidationError(
      `Key Validation Error: ${key} cannot contain commas.`
    )
  }
}

/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
export function isFeatureAvailable(): boolean {
  const cacheServiceVersion = getCacheServiceVersion()

  // Check availability based on cache service version
  switch (cacheServiceVersion) {
    case 'v2':
      // For v2, we need ACTIONS_RESULTS_URL
      return !!process.env['ACTIONS_RESULTS_URL']
    case 'v1':
    default:
      // For v1, we only need ACTIONS_CACHE_URL
      return !!process.env['ACTIONS_CACHE_URL']
  }
}

/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache. Lookup is done with prefix matching.
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for primaryKey
 * @param downloadOptions cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on windows any cache created on any platform
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
export async function restoreCache(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false
): Promise<string | undefined> {
  const cacheServiceVersion: string = getCacheServiceVersion()
  core.debug(`Cache service version: ${cacheServiceVersion}`)

  checkPaths(paths)

  switch (cacheServiceVersion) {
    case 'v2':
      return await restoreCacheV2(
        paths,
        primaryKey,
        restoreKeys,
        options,
        enableCrossOsArchive
      )
    case 'v1':
    default:
      return await restoreCacheV1(
        paths,
        primaryKey,
        restoreKeys,
        options,
        enableCrossOsArchive
      )
  }
}

/**
 * Restores cache using the legacy Cache Service
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache. Lookup is done with prefix matching.
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for primaryKey
 * @param options cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on Windows any cache created on any platform
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
async function restoreCacheV1(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false
): Promise<string | undefined> {
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

  const compressionMethod = await utils.getCompressionMethod()
  let archivePath = ''
  try {
    // path are needed to compute version
    const cacheEntry = await cacheHttpClient.getCacheEntry(keys, paths, {
      compressionMethod,
      enableCrossOsArchive
    })
    if (!cacheEntry?.archiveLocation) {
      // Cache not found
      return undefined
    }

    if (options?.lookupOnly) {
      core.info('Lookup only - skipping download')
      return cacheEntry.cacheKey
    }

    archivePath = path.join(
      await utils.createTempDirectory(),
      utils.getCacheFileName(compressionMethod)
    )
    core.debug(`Archive Path: ${archivePath}`)

    // Download the cache from the cache entry
    await cacheHttpClient.downloadCache(
      cacheEntry.archiveLocation,
      archivePath,
      options
    )

    if (core.isDebug()) {
      await listTar(archivePath, compressionMethod)
    }

    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.info(
      `Cache Size: ~${Math.round(
        archiveFileSize / (1024 * 1024)
      )} MB (${archiveFileSize} B)`
    )

    await extractTar(archivePath, compressionMethod)
    core.info('Cache restored successfully')

    return cacheEntry.cacheKey
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else {
      // warn on cache restore failure and continue build
      // Log server errors (5xx) as errors, all other errors as warnings
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
    // Try to delete the archive to save space
    try {
      await utils.unlinkFile(archivePath)
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }

  return undefined
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

    const response = await twirpClient.GetCacheEntryDownloadURL(request)

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
      // Supress all non-validation cache related errors because caching should be optional
      // Log server errors (5xx) as errors, all other errors as warnings
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
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param enableCrossOsArchive an optional boolean enabled to save cache on windows which could be restored on any platform
 * @param options cache upload options
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
export async function saveCache(
  paths: string[],
  key: string,
  options?: UploadOptions,
  enableCrossOsArchive = false
): Promise<number> {
  const cacheServiceVersion: string = getCacheServiceVersion()
  core.debug(`Cache service version: ${cacheServiceVersion}`)
  checkPaths(paths)
  checkKey(key)
  switch (cacheServiceVersion) {
    case 'v2':
      return await saveCacheV2(paths, key, options, enableCrossOsArchive)
    case 'v1':
    default:
      return await saveCacheV1(paths, key, options, enableCrossOsArchive)
  }
}

/**
 * Save cache using the legacy Cache Service
 *
 * @param paths
 * @param key
 * @param options
 * @param enableCrossOsArchive
 * @returns
 */
async function saveCacheV1(
  paths: string[],
  key: string,
  options?: UploadOptions,
  enableCrossOsArchive = false
): Promise<number> {
  const compressionMethod = await utils.getCompressionMethod()
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
    const fileSizeLimit = 10 * 1024 * 1024 * 1024 // 10GB per repo limit
    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.debug(`File Size: ${archiveFileSize}`)

    // For GHES, this check will take place in ReserveCache API with enterprise file size limit
    if (archiveFileSize > fileSizeLimit && !isGhes()) {
      throw new Error(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`
      )
    }

    core.debug('Reserving Cache')
    const reserveCacheResponse = await cacheHttpClient.reserveCache(
      key,
      paths,
      {
        compressionMethod,
        enableCrossOsArchive,
        cacheSize: archiveFileSize
      }
    )

    if (reserveCacheResponse?.result?.cacheId) {
      cacheId = reserveCacheResponse?.result?.cacheId
    } else if (reserveCacheResponse?.statusCode === 400) {
      throw new Error(
        reserveCacheResponse?.error?.message ??
          `Cache size of ~${Math.round(
            archiveFileSize / (1024 * 1024)
          )} MB (${archiveFileSize} B) is over the data cap limit, not saving cache.`
      )
    } else {
      throw new ReserveCacheError(
        `Unable to reserve cache with key ${key}, another job may be creating this cache. More details: ${reserveCacheResponse?.error?.message}`
      )
    }

    core.debug(`Saving Cache (ID: ${cacheId})`)
    await cacheHttpClient.saveCache(cacheId, archivePath, '', options)
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else if (typedError.name === ReserveCacheError.name) {
      core.info(`Failed to save: ${typedError.message}`)
    } else {
      // Log server errors (5xx) as errors, all other errors as warnings
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

    // For GHES, this check will take place in ReserveCache API with enterprise file size limit
    if (archiveFileSize > CacheFileSizeLimit && !isGhes()) {
      throw new Error(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`
      )
    }

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
        throw new Error('Response was not ok')
      }
      signedUploadUrl = response.signedUploadUrl
    } catch (error) {
      core.debug(`Failed to reserve cache: ${error}`)
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
    } else {
      // Log server errors (5xx) as errors, all other errors as warnings
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

/**
 * Deletes a cache item with the specified key
 *
 * @param key an explicit key for the cache to delete
 * @param ref only delete items with key for this reference The ref for a branch should be formatted as
 * refs/heads/<branch name>. To reference a pull request use refs/pull/<number>/merge.
 */
export async function deleteCacheWithKey(
  key: string,
  ref?: string
): Promise<number> {
  checkKey(key)

  core.debug(`Deleting Cache with key "${key}" and ref "${ref}"`)
  const deleteCacheResponse = await cacheHttpClient.deleteCacheWithKey(key, ref)
  if (deleteCacheResponse?.statusCode !== 200) {
    throw new DeleteCacheError(
      `Unable to delete cache with key ${key}. More details: ${deleteCacheResponse?.error?.message}`
    )
  }

  return deleteCacheResponse?.result?.totalCount
}

/**
 * Deletes a cache item with the specified id
 *
 * @param id an explicit id for the cache to delete
 */
export async function deleteCacheWithId(id: number): Promise<number> {
  core.debug(`Deleting Cache with id ${id.toString()}`)
  const deleteCacheResponse = await cacheHttpClient.deleteCacheWithId(id)
  if (deleteCacheResponse?.statusCode !== 204) {
    throw new DeleteCacheError(
      `Unable to delete cache with id ${id}. More details: ${deleteCacheResponse?.error?.message}`
    )
  }

  return deleteCacheResponse?.result?.totalCount
}
