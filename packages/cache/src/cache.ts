import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import {createTar, extractTar} from './internal/tar'

function checkPaths(paths: string[]): void {
  if (!paths || paths.length === 0) {
    throw new Error(
      `Path Validation Error: At least one directory or file path is required`
    )
  }
}

function checkKey(key: string): void {
  if (key.length > 512) {
    throw new Error(
      `Key Validation Error: ${key} cannot be larger than 512 characters.`
    )
  }
  const regex = /^[^,]*$/
  if (!regex.test(key)) {
    throw new Error(`Key Validation Error: ${key} cannot contain commas.`)
  }
}

/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @returns string returns the key for the cache hit, otherwise return undefined
 */
export async function restoreCache(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[]
): Promise<string | undefined> {
  checkPaths(paths)

  restoreKeys = restoreKeys || []
  const keys = [primaryKey, ...restoreKeys]

  core.debug('Resolved Keys:')
  core.debug(JSON.stringify(keys))

  if (keys.length > 10) {
    throw new Error(
      `Key Validation Error: Keys are limited to a maximum of 10.`
    )
  }
  for (const key of keys) {
    checkKey(key)
  }

  const compressionMethod = await utils.getCompressionMethod()

  // path are needed to compute version
  const cacheEntry = await cacheHttpClient.getCacheEntry(keys, paths, {
    compressionMethod
  })
  if (!cacheEntry?.archiveLocation) {
    core.info(`Cache not found for input keys: ${keys.join(', ')}`)
    return undefined
  }

  const archivePath = path.join(
    await utils.createTempDirectory(),
    utils.getCacheFileName(compressionMethod)
  )
  core.debug(`Archive Path: ${archivePath}`)

  try {
    // Download the cache from the cache entry
    await cacheHttpClient.downloadCache(cacheEntry.archiveLocation, archivePath)

    const archiveFileSize = utils.getArchiveFileSize(archivePath)
    core.info(
      `Cache Size: ~${Math.round(
        archiveFileSize / (1024 * 1024)
      )} MB (${archiveFileSize} B)`
    )

    await extractTar(archivePath, compressionMethod)
  } finally {
    // Try to delete the archive to save space
    try {
      await utils.unlinkFile(archivePath)
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }

  core.info(`Cache restored from key: ${cacheEntry && cacheEntry.cacheKey}`)

  return cacheEntry.cacheKey
}

/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @returns number returns cacheId if the cache was saved successfully
 */
export async function saveCache(paths: string[], key: string): Promise<number> {
  checkPaths(paths)
  checkKey(key)

  const compressionMethod = await utils.getCompressionMethod()

  core.debug('Reserving Cache')
  const cacheId = await cacheHttpClient.reserveCache(key, paths, {
    compressionMethod
  })
  if (cacheId === -1) {
    throw new Error(
      `Unable to reserve cache with key ${key}, another job may be creating this cache.`
    )
  }
  core.debug(`Cache ID: ${cacheId}`)
  const cachePaths = await utils.resolvePaths(paths)

  core.debug('Cache Paths:')
  core.debug(`${JSON.stringify(cachePaths)}`)

  const archiveFolder = await utils.createTempDirectory()
  const archivePath = path.join(
    archiveFolder,
    utils.getCacheFileName(compressionMethod)
  )

  core.debug(`Archive Path: ${archivePath}`)

  await createTar(archiveFolder, cachePaths, compressionMethod)

  const fileSizeLimit = 5 * 1024 * 1024 * 1024 // 5GB per repo limit
  const archiveFileSize = utils.getArchiveFileSize(archivePath)
  core.debug(`File Size: ${archiveFileSize}`)
  if (archiveFileSize > fileSizeLimit) {
    throw new Error(
      `Cache size of ~${Math.round(
        archiveFileSize / (1024 * 1024)
      )} MB (${archiveFileSize} B) is over the 5GB limit, not saving cache.`
    )
  }

  core.debug(`Saving Cache (ID: ${cacheId})`)
  await cacheHttpClient.saveCache(cacheId, archivePath)

  return cacheId
}
