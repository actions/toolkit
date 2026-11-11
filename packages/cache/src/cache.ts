import * as core from '@actions/core'
import {
  getCacheServiceVersion,
  getCacheMode,
  isCacheReadable,
  isCacheWritable
} from './internal/config.js'
import {DownloadOptions, UploadOptions} from './options.js'
import {getCacheBackend} from './internal/backends/index.js'
import {checkKey, checkPaths} from './internal/validation.js'

export type {DownloadOptions, UploadOptions}
export {
  ValidationError,
  ReserveCacheError,
  CACHE_WRITE_DENIED_PREFIX,
  CacheWriteDeniedError,
  CACHE_READ_DENIED_PREFIX,
  CacheReadDeniedError,
  FinalizeCacheError
} from './internal/errors.js'

/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
export function isFeatureAvailable(): boolean {
  return getCacheBackend(getCacheServiceVersion()).isAvailable()
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

  const cacheMode = getCacheMode()
  if (!isCacheReadable(cacheMode)) {
    core.info(
      `Cache restore skipped: the effective cache-mode '${cacheMode}' does not permit reads.`
    )
    core.debug(
      `Skipped restore for paths [${paths.join(', ')}] with primary key '${primaryKey}'.`
    )
    return undefined
  }

  return await getCacheBackend(cacheServiceVersion).restoreCache(
    paths,
    primaryKey,
    restoreKeys,
    options,
    enableCrossOsArchive
  )
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

  const cacheMode = getCacheMode()
  if (!isCacheWritable(cacheMode)) {
    core.info(
      `Cache save skipped: the effective cache-mode '${cacheMode}' does not permit writes.`
    )
    core.debug(
      `Skipped save for paths [${paths.join(', ')}] with key '${key}'.`
    )
    return -1
  }

  return await getCacheBackend(cacheServiceVersion).saveCache(
    paths,
    key,
    options,
    enableCrossOsArchive
  )
}
