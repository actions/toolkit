import * as core from '@actions/core'
import * as path from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import {
  createTar,
  extractStreamingTar,
  extractTar,
  listTar
} from './internal/tar'
import {DownloadOptions, getUploadOptions} from './options'
import {isSuccessStatusCode} from './internal/requestUtils'
import {getDownloadCommandPipeForWget} from './internal/downloadUtils'
import {ChildProcessWithoutNullStreams} from 'child_process'

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
  return !!process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN']
}

/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @param downloadOptions cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on windows any cache created on any platform
 * @param enableCrossArchArchive an optional boolean enabled to restore cache created on any arch
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
export async function restoreCache(
  paths: string[],
  primaryKey: string,
  restoreKeys?: string[],
  options?: DownloadOptions,
  enableCrossOsArchive = false,
  enableCrossArchArchive = false
): Promise<string | undefined> {
  checkPaths(paths)
  checkKey(primaryKey)

  restoreKeys = restoreKeys ?? []

  core.debug('Resolved Restore Keys:')
  core.debug(JSON.stringify(restoreKeys))

  if (restoreKeys.length > 9) {
    throw new ValidationError(
      `Key Validation Error: Keys are limited to a maximum of 10.`
    )
  }
  for (const key of restoreKeys) {
    checkKey(key)
  }

  const compressionMethod = await utils.getCompressionMethod()
  let archivePath = ''
  try {
    // path are needed to compute version
    const cacheEntry = await cacheHttpClient.getCacheEntry(
      primaryKey,
      restoreKeys,
      paths,
      {
        compressionMethod,
        enableCrossOsArchive,
        enableCrossArchArchive
      }
    )

    if (!cacheEntry) {
      // Internal Error
      return undefined
    }

    archivePath = path.join(
      await utils.createTempDirectory(),
      utils.getCacheFileName(compressionMethod)
    )
    core.debug(`Archive Path: ${archivePath}`)

    let cacheKey: string = ''

    switch (cacheEntry.provider) {
      case 's3': {
        if (!cacheEntry.s3?.pre_signed_url) {
          return undefined
        }

        cacheKey = cacheEntry.s3.pre_signed_url

        if (options?.lookupOnly) {
          core.info('Lookup only - skipping download')
          return cacheKey
        }

        await cacheHttpClient.downloadCache(
          cacheEntry.provider,
          cacheEntry.s3?.pre_signed_url,
          archivePath
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
        break
      }

      case 'gcs': {
        if (!cacheEntry.gcs?.cache_key) {
          return undefined
        }
        cacheKey = cacheEntry.gcs?.cache_key

        if (options?.lookupOnly) {
          core.info('Lookup only - skipping download')
          return cacheKey
        }

        const archiveLocation = `gs://${cacheEntry.gcs?.bucket_name}/${cacheEntry.gcs?.cache_key}`

        /*
        * Alternate, Multipart download method for GCS
        await cacheHttpClient.downloadCache(
          cacheEntry.provider,
          archiveLocation,
          archivePath,
          cacheEntry.gcs?.short_lived_token?.access_token ?? ''
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
        */

        // For GCS, we do a streaming download which means that we extract the archive while we are downloading it.

        let readStream: NodeJS.ReadableStream | undefined
        let downloadCommandPipe: ChildProcessWithoutNullStreams | undefined

        if (cacheEntry?.gcs?.pre_signed_url) {
          downloadCommandPipe = getDownloadCommandPipeForWget(
            cacheEntry?.gcs?.pre_signed_url
          )
        } else {
          readStream = cacheHttpClient.downloadCacheStreaming(
            'gcs',
            archiveLocation,
            cacheEntry?.gcs?.short_lived_token?.access_token ?? ''
          )

          if (!readStream) {
            return undefined
          }
        }

        await extractStreamingTar(
          readStream,
          archivePath,
          compressionMethod,
          downloadCommandPipe
        )
        core.info('Cache restored successfully')
        break
      }
    }

    return cacheKey
  } catch (error) {
    const typedError = error as Error
    if (typedError.name === ValidationError.name) {
      throw error
    } else {
      // Suppress all non-validation cache related errors because caching should be optional
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
 * @param enableCrossArchArchive an optional boolean enabled to save cache on any arch which could be restored on any arch
 * @returns string returns cacheId if the cache was saved successfully and throws an error if save fails
 */
export async function saveCache(
  paths: string[],
  key: string,
  enableCrossOsArchive = false,
  enableCrossArchArchive = false
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
    const fileSizeLimit = 1000 * 1024 * 1024 * 1024 // 1000GB per repo limit
    const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath)
    core.debug(`File Size: ${archiveFileSize}`)

    if (archiveFileSize > fileSizeLimit) {
      throw new Error(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 1000GB limit, not saving cache.`
      )
    }

    const cacheVersion = cacheHttpClient.getCacheVersion(
      paths,
      compressionMethod,
      enableCrossOsArchive,
      enableCrossArchArchive
    )

    core.debug('Reserving Cache')
    // Calculate number of chunks required. This is only required if backend is S3 as Google Cloud SDK will do it for us
    const uploadOptions = getUploadOptions()
    const maxChunkSize = uploadOptions?.uploadChunkSize ?? 32 * 1024 * 1024 // Default 32MB
    const numberOfChunks = Math.floor(archiveFileSize / maxChunkSize)
    const reserveCacheResponse = await cacheHttpClient.reserveCache(
      key,
      numberOfChunks,
      cacheVersion
    )

    if (!isSuccessStatusCode(reserveCacheResponse?.statusCode)) {
      core.debug(`Failed to reserve cache: ${reserveCacheResponse?.statusCode}`)
      core.debug(
        `Reserve Cache Request: ${JSON.stringify({
          key,
          numberOfChunks,
          cacheVersion
        })}`
      )
      throw new Error(
        reserveCacheResponse?.error?.message ??
          `Cache size of ~${Math.round(
            archiveFileSize / (1024 * 1024)
          )} MB (${archiveFileSize} B) is over the data cap limit, not saving cache.`
      )
    }

    switch (reserveCacheResponse.result?.provider) {
      case 's3':
        core.debug(`Saving Cache to S3`)
        cacheKey = await cacheHttpClient.saveCache(
          's3',
          key,
          cacheVersion,
          archivePath,
          reserveCacheResponse?.result?.s3?.upload_id ?? '',
          reserveCacheResponse?.result?.s3?.upload_key ?? '',
          numberOfChunks,
          reserveCacheResponse?.result?.s3?.pre_signed_urls ?? []
        )
        break

      case 'gcs':
        core.debug(`Saving Cache to GCS`)
        cacheKey = await cacheHttpClient.saveCache(
          'gcs',
          key,
          cacheVersion,
          archivePath,
          // S3 Params are undefined for GCS
          undefined,
          undefined,
          undefined,
          undefined,
          reserveCacheResponse?.result?.gcs?.short_lived_token?.access_token ??
            '',
          reserveCacheResponse?.result?.gcs?.bucket_name ?? '',
          reserveCacheResponse?.result?.gcs?.cache_key ?? ''
        )
        break
    }
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
 * @param key The cache keys
 */
export async function deleteCache(
  paths: string[],
  key: string,
  enableCrossOsArchive = false,
  enableCrossArchArchive = false
): Promise<void> {
  checkKey(key)

  core.debug('Deleting Cache')
  core.debug(`Cache Key: ${key}`)

  const compressionMethod = await utils.getCompressionMethod()

  const cacheVersion = cacheHttpClient.getCacheVersion(
    paths,
    compressionMethod,
    enableCrossOsArchive,
    enableCrossArchArchive
  )

  try {
    await cacheHttpClient.deleteCache(key, cacheVersion)
  } catch (error) {
    core.warning(`Failed to delete cache: ${error}`)
  }
}
