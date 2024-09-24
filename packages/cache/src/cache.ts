import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as config from './internal/config'
import * as cacheHttpClient from './internal/cacheHttpClient'
import * as cacheTwirpClient from './internal/cacheTwirpClient'
import { createTar, extractTar, listTar } from './internal/tar'
import { DownloadOptions, UploadOptions } from './options'
import {
  CreateCacheEntryRequest,
  CreateCacheEntryResponse,
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  GetCacheEntryDownloadURLRequest,
  GetCacheEntryDownloadURLResponse
} from './generated/results/api/v1/cache'
import { UploadCacheStream } from './internal/v2/upload-cache'
import { StreamExtract } from './internal/v2/download-cache'
import {
  UploadZipSpecification,
  getUploadZipSpecification
} from '@actions/artifact/lib/internal/upload/upload-zip-specification'
import { createZipUploadStream } from '@actions/artifact/lib/internal/upload/zip'
import { getBackendIdsFromToken, BackendIds } from '@actions/artifact/lib/internal/shared/util'

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

// export function isFeatureAvailable(): boolean {
//   return !!CacheUrl
// }

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

  const cacheServiceVersion: string = config.getCacheServiceVersion()
  console.debug(`Cache Service Version: ${cacheServiceVersion}`)
  switch (cacheServiceVersion) {
    case "v2":
      return await restoreCachev2(paths, primaryKey, restoreKeys, options, enableCrossOsArchive)
    case "v1":
    default:
      return await restoreCachev1(paths, primaryKey, restoreKeys, options, enableCrossOsArchive)
  }
}

async function restoreCachev1(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false
) {
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

async function restoreCachev2(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false
) {

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

  try {
    // BackendIds are retrieved form the signed JWT
    const backendIds: BackendIds = getBackendIdsFromToken()
    const compressionMethod = await utils.getCompressionMethod()
    const twirpClient = cacheTwirpClient.internalCacheTwirpClient()
    const request: GetCacheEntryDownloadURLRequest = {
      workflowRunBackendId: backendIds.workflowRunBackendId,
      workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
      key: primaryKey,
      restoreKeys: restoreKeys,
      version: utils.getCacheVersion(
        paths,
        compressionMethod,
        enableCrossOsArchive,
      ),
    }
    const response: GetCacheEntryDownloadURLResponse = await twirpClient.GetCacheEntryDownloadURL(request)
    core.info(`GetCacheEntryDownloadURLResponse: ${JSON.stringify(response)}`)

    if (!response.ok) {
      // Cache not found
      core.warning(`Cache not found for keys: ${keys.join(', ')}`)
      return undefined
    }

    core.info(`Cache hit for: ${request.key}`)
    core.info(`Starting download of artifact to: ${paths[0]}`)
    await StreamExtract(response.signedDownloadUrl, path.dirname(paths[0]))
    core.info(`Artifact download completed successfully.`)

    return keys[0]
  } catch (error) {
    throw new Error(`Unable to download and extract cache: ${error.message}`)
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

  const cacheServiceVersion: string = config.getCacheServiceVersion()
  console.debug(`Cache Service Version: ${cacheServiceVersion}`)
  switch (cacheServiceVersion) {
    case "v2":
      return await saveCachev2(paths, key, options, enableCrossOsArchive)
    case "v1":
    default:
      return await saveCachev1(paths, key, options, enableCrossOsArchive)
  }
}

async function saveCachev1(
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
    if (archiveFileSize > fileSizeLimit && !utils.isGhes()) {
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

async function saveCachev2(
  paths: string[],
  key: string,
  options?: UploadOptions,
  enableCrossOsArchive = false
): Promise<number> {
  // BackendIds are retrieved form the signed JWT
  const backendIds: BackendIds = getBackendIdsFromToken()
  const compressionMethod = await utils.getCompressionMethod()
  const version = utils.getCacheVersion(
    paths,
    compressionMethod,
    enableCrossOsArchive
  )
  const twirpClient = cacheTwirpClient.internalCacheTwirpClient()
  const request: CreateCacheEntryRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    key: key,
    version: version
  }
  const response: CreateCacheEntryResponse = await twirpClient.CreateCacheEntry(request)
  core.info(`CreateCacheEntryResponse: ${JSON.stringify(response)}`)

  // Archive
  // We're going to handle 1 path fow now. This needs to be fixed to handle all 
  // paths passed in.
  const rootDir = path.dirname(paths[0])
  const zipSpecs: UploadZipSpecification[] = getUploadZipSpecification(paths, rootDir)
  if (zipSpecs.length === 0) {
    throw new Error(
      `Error with zip specs: ${zipSpecs.flatMap(s => (s.sourcePath ? [s.sourcePath] : [])).join(', ')}`
    )
  }

  // 0: No compression
  // 1: Best speed
  // 6: Default compression (same as GNU Gzip)
  // 9: Best compression Higher levels will result in better compression, but will take longer to complete. For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
  const zipUploadStream = await createZipUploadStream(
    zipSpecs,
    6
  )

  // Cache v2 upload
  // inputs:
  // - getSignedUploadURL
  // - archivePath
  core.info(`Saving Cache v2: ${paths[0]}`)
  await UploadCacheStream(response.signedUploadUrl, zipUploadStream)

  // Finalize the cache entry
  const finalizeRequest: FinalizeCacheEntryUploadRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    key: key,
    version: version,
    sizeBytes: "1024",
  }

  const finalizeResponse: FinalizeCacheEntryUploadResponse = await twirpClient.FinalizeCacheEntryUpload(finalizeRequest)
  core.info(`FinalizeCacheEntryUploadResponse: ${JSON.stringify(finalizeResponse)}`)

  return 0
}