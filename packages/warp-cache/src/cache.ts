import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import {createTar, extractTar, listTar} from './internal/tar'
import {DownloadOptions, getUploadOptions} from './options'

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

  restoreKeys = restoreKeys ?? []
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
    if (!cacheEntry?.pre_signed_url) {
      // Cache not found
      return undefined
    }

    if (options?.lookupOnly) {
      core.info('Lookup only - skipping download')
      return cacheEntry.cache_key
    }

    archivePath = path.join(
      await utils.createTempDirectory(),
      utils.getCacheFileName(compressionMethod)
    )
    core.debug(`Archive Path: ${archivePath}`)

    // Download the cache from the cache entry
    await cacheHttpClient.downloadCache(cacheEntry.pre_signed_url, archivePath)

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

    return cacheEntry.cache_key
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
  enableCrossOsArchive = false
): Promise<string> {
  checkPaths(paths)
  checkKey(key)

  const compressionMethod = await utils.getCompressionMethod()

  const cachePaths = await utils.resolvePaths(paths)
  let cacheKey = ''
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
    const fileSizeLimit = 20 * 1024 * 1024 * 1024 // 20GB per repo limit
    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.debug(`File Size: ${archiveFileSize}`)

    // For GHES, this check will take place in ReserveCache API with enterprise file size limit
    if (archiveFileSize > fileSizeLimit && !utils.isGhes()) {
      throw new Error(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`
      )
    }

    core.debug('Reserving Cache')
    // Calculate number of chunks required
    const uploadOptions = getUploadOptions()
    const maxChunkSize = uploadOptions?.uploadChunkSize ?? 32 * 1024 * 1024 // Default 32MB
    const numberOfChunks = Math.floor(archiveFileSize / maxChunkSize)
    const reserveCacheResponse = await cacheHttpClient.reserveCache(
      key,
      numberOfChunks,
      {
        compressionMethod,
        enableCrossOsArchive,
        cacheSize: archiveFileSize
      }
    )

    if (reserveCacheResponse?.statusCode === 400) {
      throw new Error(
        reserveCacheResponse?.error?.message ??
          `Cache size of ~${Math.round(
            archiveFileSize / (1024 * 1024)
          )} MB (${archiveFileSize} B) is over the data cap limit, not saving cache.`
      )
    }

    core.debug(`Saving Cache`)
    cacheKey = await cacheHttpClient.saveCache(
      key,
      cacheHttpClient.getCacheVersion(
        paths,
        compressionMethod,
        enableCrossOsArchive
      ),
      reserveCacheResponse?.result?.upload_id ?? '',
      reserveCacheResponse?.result?.upload_key ?? '',
      numberOfChunks,
      reserveCacheResponse?.result?.pre_signed_urls ?? [],
      archivePath
    )
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

  return cacheKey
}

/**
 * Deletes an entire cache by cache key.
 * @param keys The cache keys
 */
export async function deleteCache(keys: string[]): Promise<void> {
  for (const key of keys) {
    checkKey(key)
  }

  core.debug('Deleting Cache')
  core.debug(`Cache Keys: ${keys}`)

  try {
    await cacheHttpClient.deleteCache(keys)
  } catch (error) {
    core.warning(`Failed to delete cache: ${error}`)
  }
}
