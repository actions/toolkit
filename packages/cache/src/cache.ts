import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import * as cacheTwirpClient from './internal/shared/cacheTwirpClient'
import { getCacheServiceVersion, isGhes } from './internal/config'
import { DownloadOptions, UploadOptions } from './options'
import { createTar, extractTar, listTar } from './internal/tar'
import {
  CreateCacheEntryRequest,
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  GetCacheEntryDownloadURLRequest
} from './generated/results/api/v1/cache'
import { CacheFileSizeLimit } from './internal/constants'
import { uploadCacheFile } from './internal/blob/upload-cache'
import { downloadCacheFile } from './internal/blob/download-cache'
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
  return !!process.env['ACTIONS_CACHE_URL']
}

/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
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
  checkPaths(paths)

  const cacheServiceVersion: string = getCacheServiceVersion()
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
 * @param paths
 * @param primaryKey
 * @param restoreKeys
 * @param options
 * @param enableCrossOsArchive
 * @returns
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
      // Supress all non-validation cache related errors because caching should be optional
      core.warning(`Failed to restore: ${(error as Error).message}`)
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
 * Restores cache using the new Cache Service
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
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
      core.warning(`Cache not found for keys: ${keys.join(', ')}`)
      return undefined
    }

    core.info(`Cache hit for: ${request.key}`)

    if (options?.lookupOnly) {
      core.info('Lookup only - skipping download')
      return request.key
    }

    archivePath = path.join(
      await utils.createTempDirectory(),
      utils.getCacheFileName(compressionMethod)
    )
    core.debug(`Archive path: ${archivePath}`)
    core.debug(`Starting download of archive to: ${archivePath}`)

    await downloadCacheFile(response.signedDownloadUrl, archivePath)

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

    return request.key
  } catch (error) {
    throw new Error(`Failed to restore: ${error.message}`)
  } finally {
    try {
      if (archivePath) {
        await utils.unlinkFile(archivePath)
      }
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }
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
  checkPaths(paths)
  checkKey(key)

  const cacheServiceVersion: string = getCacheServiceVersion()
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
    await cacheHttpClient.saveCache(cacheId, archivePath, options)
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else if (typedError.name === ReserveCacheError.name) {
      core.info(`Failed to save: ${typedError.message}`)
    } else {
      core.warning(`Failed to save: ${typedError.message}`)
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
 * Save cache using the new Cache Service
 *
 * @param paths
 * @param key
 * @param options
 * @param enableCrossOsArchive
 * @returns
 */
async function saveCacheV2(
  paths: string[],
  key: string,
  options?: UploadOptions,
  enableCrossOsArchive = false
): Promise<number> {
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

    const response = await twirpClient.CreateCacheEntry(request)
    if (!response.ok) {
      throw new ReserveCacheError(
        `Unable to reserve cache with key ${key}, another job may be creating this cache.`
      )
    }

    core.debug(`Attempting to upload cache located at: ${archivePath}`)
    await uploadCacheFile(response.signedUploadUrl, archivePath)

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
    core.warning(`Failed to save: ${typedError.message}`)
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
