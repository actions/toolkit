import * as core from '@actions/core'
import * as path from 'path'
import * as utils from '@actions/cache/lib/internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import {createTar, extractTar, listTar} from '@actions/cache/lib/internal/tar'
import {DownloadOptions, UploadOptions} from '@actions/cache/lib/options'
import {S3ClientConfig} from '@aws-sdk/client-s3'

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
 * @param options cache download options
 * @param s3Options upload options for AWS S3
 * @param s3BucketName a name of AWS S3 bucket
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
export async function restoreCache(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<string | undefined> {
  checkPaths(paths)

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

  // path are needed to compute version
  const cacheEntry = await cacheHttpClient.getCacheEntry(
    keys,
    paths,
    {
      compressionMethod
    },
    s3Options,
    s3BucketName
  )
  if (!cacheEntry?.archiveLocation && !cacheEntry?.cacheKey) {
    // Cache not found
    return undefined
  }

  if (options?.lookupOnly) {
    core.info('Lookup only - skipping download')
    return cacheEntry.cacheKey
  }

  const archivePath = path.join(
    await utils.createTempDirectory(),
    utils.getCacheFileName(compressionMethod)
  )
  core.debug(`Archive Path: ${archivePath}`)

  try {
    // Download the cache from the cache entry
    await cacheHttpClient.downloadCache(
      cacheEntry,
      archivePath,
      options,
      s3Options,
      s3BucketName
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
  } finally {
    // Try to delete the archive to save space
    try {
      await utils.unlinkFile(archivePath)
    } catch (error) {
      core.debug(`Failed to delete archive: ${error}`)
    }
  }

  return cacheEntry.cacheKey
}

/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param options cache upload options
 * @param s3Options upload options for AWS S3
 * @param s3BucketName a name of AWS S3 bucket
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
export async function saveCache(
  paths: string[],
  key: string,
  options?: UploadOptions,
  s3Options?: S3ClientConfig,
  s3BucketName?: string
): Promise<number> {
  checkPaths(paths)
  checkKey(key)

  const compressionMethod = await utils.getCompressionMethod()
  let cacheId = 0

  const cachePaths = await utils.resolvePaths(paths)
  core.debug('Cache Paths:')
  core.debug(`${JSON.stringify(cachePaths)}`)

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
    if (archiveFileSize > fileSizeLimit && !utils.isGhes()) {
      throw new Error(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`
      )
    }

    if (!(s3Options && s3BucketName)) {
      core.debug('Reserving Cache')
      const reserveCacheResponse = await cacheHttpClient.reserveCache(
        key,
        paths,
        {
          compressionMethod,
          cacheSize: archiveFileSize
        },
        s3Options,
        s3BucketName
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
    }

    core.debug(`Saving Cache (ID: ${cacheId})`)
    await cacheHttpClient.saveCache(
      cacheId,
      archivePath,
      key,
      options,
      s3Options,
      s3BucketName
    )
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
