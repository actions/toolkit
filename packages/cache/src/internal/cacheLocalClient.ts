import * as core from '@actions/core'
import * as crypto from 'crypto'
import * as fs from 'fs'

import {CompressionMethod} from './constants'
import {
  ArtifactCacheEntry,
  InternalCacheOptions,
  ReserveCacheResponse,
  ITypedResponseWithError,
} from './contracts'
import {
  DownloadOptions,
  UploadOptions,
} from '../options'

const versionSalt = '1.0'

const cacheIds: { [cacheId: number]: string } = {}

export function getCacheVersion(
  paths: string[],
  compressionMethod?: CompressionMethod,
  enableCrossOsArchive = false
): string {
  const components = paths

  // Add compression method to cache version to restore
  // compressed cache as per compression method
  if (compressionMethod) {
    components.push(compressionMethod)
  }

  // Only check for windows platforms if enableCrossOsArchive is false
  if (process.platform === 'win32' && !enableCrossOsArchive) {
    components.push('windows-only')
  }

  // Add salt to cache version to support breaking changes in cache entry
  components.push(versionSalt)

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
}

export async function getCacheEntry(
  keys: string[],
  paths: string[],
  options?: InternalCacheOptions
): Promise<ArtifactCacheEntry | null> {
  const cacheVersion = getCacheVersion(
    paths,
    options?.compressionMethod,
    options?.enableCrossOsArchive
  )

  let fileStat: fs.Stats | undefined
  let cacheKey: string | undefined
  for (let i = 0; i < keys.length && !fileStat; i++) {
    try {
      cacheKey = keys[i]
      fileStat = await fs.promises.stat(`/cache/${cacheKey}`)
    } catch {}
  }

  if (!fileStat) {
    return null
  }

  return {
    cacheKey,
    cacheVersion,
    creationTime: fileStat.ctime.toISOString(),
    archiveLocation: `/cache/${cacheKey}/cache.tar`,
  }
}

export async function downloadCache(
  archiveLocation: string,
  archivePath: string,
  options?: DownloadOptions
): Promise<void> {
  return fs.promises.copyFile(archiveLocation, archivePath)
}

// Reserve Cache
export async function reserveCache(
  key: string,
  paths: string[],
  options?: InternalCacheOptions
): Promise<ITypedResponseWithError<ReserveCacheResponse>> {
  const cacheId = Object.keys(cacheIds).length + 1
  cacheIds[cacheId] = key

  return {
    statusCode: 200,
    headers: {},
    result: {
      cacheId,
    }
  }
}

export async function saveCache(
  cacheId: number,
  archivePath: string,
  options?: UploadOptions
): Promise<void> {
  const cacheKey = cacheIds[cacheId]
  const cacheDir = `/cache/${cacheKey}`
  const cacheFile = `${cacheDir}/cache.tar`
  await fs.promises.mkdir(cacheDir, { recursive: true })
  await fs.promises.copyFile(archivePath, cacheFile)
  core.info(`Cache saved successfully, saved ${archivePath} to ${cacheFile}`)
}
