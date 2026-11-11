import * as core from '@actions/core'
import * as path from 'path'
import * as utils from '../cacheUtils.js'
import * as cacheHttpClient from '../cacheHttpClient.js'
import {isGhes} from '../config.js'
import {DownloadOptions, UploadOptions} from '../../options.js'
import {createTar, extractTar, listTar} from '../tar.js'
import {HttpClientError} from '@actions/http-client'
import {
  CACHE_READ_DENIED_PREFIX,
  CACHE_WRITE_DENIED_PREFIX,
  CacheReadDeniedError,
  CacheWriteDeniedError,
  ReserveCacheError,
  ValidationError
} from '../errors.js'
import {checkKey} from '../validation.js'
import {CacheBackend} from './backend.js'

export const v1Backend: CacheBackend = {
  isAvailable: () => !!process.env['ACTIONS_CACHE_URL'],
  restoreCache: restoreCacheV1,
  saveCache: saveCacheV1
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
    let cacheEntry
    try {
      cacheEntry = await cacheHttpClient.getCacheEntry(keys, paths, {
        compressionMethod,
        enableCrossOsArchive
      })
    } catch (error) {
      // The v1 artifact cache service returns HTTP 403 with a
      // `cache read denied:` body when the run's token has no readable cache
      // scopes. getCacheEntry lives in a dependency-free internal module and
      // cannot import CacheReadDeniedError without a circular dependency, so it
      // only surfaces the raw denial message; we classify it into the typed
      // error here so the outer catch and consumers can dispatch on it.
      const errorMessage = (error as Error)?.message ?? ''
      if (errorMessage.includes(CACHE_READ_DENIED_PREFIX)) {
        throw new CacheReadDeniedError(errorMessage)
      }
      throw error
    }
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
      // Inspect the receiver's error message before deciding which error to
      // throw. A message starting with the stable `cache write denied:`
      // prefix indicates the issuer downgraded the token to read-only
      // (policy denial), not a contention case, so we surface it as a
      // CacheWriteDeniedError which the outer catch arm logs at warning
      // level.
      const detailMessage = reserveCacheResponse?.error?.message
      if (detailMessage?.startsWith(CACHE_WRITE_DENIED_PREFIX)) {
        throw new CacheWriteDeniedError(
          `Unable to reserve cache with key ${key}. More details: ${detailMessage}`
        )
      }
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
