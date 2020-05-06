import * as core from '@actions/core'
import * as pathUtils from 'path'
import * as utils from './internal/cacheUtils'
import * as cacheHttpClient from './internal/cacheHttpClient'
import {createTar, extractTar} from './internal/tar'

/**
 * Restores cache from keys
 *
 * @param path a string representing files that were cached
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @returns string returns the key for the cache hit, otherwise return undefined
 */
export async function restoreCache(
  path: string,
  primaryKey: string,
  restoreKeys?: string[]
): Promise<string | undefined> {
  try {
    if (!path || path.length === 0) {
      throw new Error('Input required and not supplied: path')
    }

    restoreKeys = restoreKeys || []
    const keys = [primaryKey, ...restoreKeys]

    core.debug('Resolved Keys:')
    core.debug(JSON.stringify(keys))

    if (keys.length > 10) {
      core.setFailed(
        `Key Validation Error: Keys are limited to a maximum of 10.`
      )
      return undefined
    }
    for (const key of keys) {
      if (key.length > 512) {
        core.setFailed(
          `Key Validation Error: ${key} cannot be larger than 512 characters.`
        )
        return undefined
      }
      const regex = /^[^,]*$/
      if (!regex.test(key)) {
        core.setFailed(`Key Validation Error: ${key} cannot contain commas.`)
        return undefined
      }
    }

    const compressionMethod = await utils.getCompressionMethod()

    try {
      // path are needed to compute version
      const cacheEntry = await cacheHttpClient.getCacheEntry(keys, path, {
        compressionMethod
      })
      if (!cacheEntry?.archiveLocation) {
        core.info(`Cache not found for input keys: ${keys.join(', ')}`)
        return undefined
      }

      const archivePath = pathUtils.join(
        await utils.createTempDirectory(),
        utils.getCacheFileName(compressionMethod)
      )
      core.debug(`Archive Path: ${archivePath}`)

      try {
        // Download the cache from the cache entry
        await cacheHttpClient.downloadCache(
          cacheEntry.archiveLocation,
          archivePath
        )

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
    } catch (error) {
      utils.logWarning(error.message)
      return undefined
    }
  } catch (error) {
    core.setFailed(error.message)
    return undefined
  }
}

/**
 * Saves a file with the specified key
 *
 * @param path a string representing files to be cached
 * @param key an explicit key for restoring the cache
 * @returns number returns cacheId if the cache was saved successfully, otherwise return -1
 */
export async function saveCache(path: string, key: string): Promise<number> {
  try {
    if (!path || path.length === 0) {
      throw new Error('Input required and not supplied: path')
    }

    const compressionMethod = await utils.getCompressionMethod()

    core.debug('Reserving Cache')
    const cacheId = await cacheHttpClient.reserveCache(key, path, {
      compressionMethod
    })
    if (cacheId === -1) {
      core.info(
        `Unable to reserve cache with key ${key}, another job may be creating this cache.`
      )
      return -1
    }
    core.debug(`Cache ID: ${cacheId}`)
    const cachePaths = await utils.resolvePaths(
      path.split('\n').filter(x => x !== '')
    )

    core.debug('Cache Paths:')
    core.debug(`${JSON.stringify(cachePaths)}`)

    const archiveFolder = await utils.createTempDirectory()
    const archivePath = pathUtils.join(
      archiveFolder,
      utils.getCacheFileName(compressionMethod)
    )

    core.debug(`Archive Path: ${archivePath}`)

    await createTar(archiveFolder, cachePaths, compressionMethod)

    const fileSizeLimit = 5 * 1024 * 1024 * 1024 // 5GB per repo limit
    const archiveFileSize = utils.getArchiveFileSize(archivePath)
    core.debug(`File Size: ${archiveFileSize}`)
    if (archiveFileSize > fileSizeLimit) {
      utils.logWarning(
        `Cache size of ~${Math.round(
          archiveFileSize / (1024 * 1024)
        )} MB (${archiveFileSize} B) is over the 5GB limit, not saving cache.`
      )
      return -1
    }

    core.debug(`Saving Cache (ID: ${cacheId})`)
    await cacheHttpClient.saveCache(cacheId, archivePath)

    return cacheId
  } catch (error) {
    utils.logWarning(error.message)
    return -1
  }
}
