import * as core from '@actions/core'

/**
 * Options to control cache upload
 */
export interface UploadOptions {
  /**
   * Indicates whether to use the Azure Blob SDK to download caches
   * that are stored on Azure Blob Storage to improve reliability and
   * performance
   *
   * @default false
   */
  useAzureSdk?: boolean
  /**
   * Number of parallel cache upload
   *
   * @default 4
   */
  uploadConcurrency?: number
  /**
   * Maximum chunk size in bytes for cache upload
   *
   * @default 32MB
   */
  uploadChunkSize?: number
  /**
   * Archive size in bytes
   */
  archiveSizeBytes?: number
}

/**
 * Options to control cache download
 */
export interface DownloadOptions {
  /**
   * Indicates whether to use the Azure Blob SDK to download caches
   * that are stored on Azure Blob Storage to improve reliability and
   * performance
   *
   * @default true
   */
  useAzureSdk?: boolean

  /**
   * Number of parallel downloads (this option only applies when using
   * the Azure SDK)
   *
   * @default 8
   */
  downloadConcurrency?: number

  /**
   * Indicates whether to use Actions HttpClient with concurrency
   * for Azure Blob Storage
   */
  concurrentBlobDownloads?: boolean

  /**
   * Maximum time for each download request, in milliseconds (this
   * option only applies when using the Azure SDK)
   *
   * @default 30000
   */
  timeoutInMs?: number

  /**
   * Time after which a segment download should be aborted if stuck
   *
   * @default 3600000
   */
  segmentTimeoutInMs?: number

  /**
   * Weather to skip downloading the cache entry.
   * If lookupOnly is set to true, the restore function will only check if
   * a matching cache entry exists and return the cache key if it does.
   *
   * @default false
   */
  lookupOnly?: boolean
}

/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
export function getUploadOptions(copy?: UploadOptions): UploadOptions {
  // Defaults if not overriden
  const result: UploadOptions = {
    useAzureSdk: false,
    uploadConcurrency: 4,
    uploadChunkSize: 32 * 1024 * 1024
  }

  if (copy) {
    if (typeof copy.useAzureSdk === 'boolean') {
      result.useAzureSdk = copy.useAzureSdk
    }

    if (typeof copy.uploadConcurrency === 'number') {
      result.uploadConcurrency = copy.uploadConcurrency
    }

    if (typeof copy.uploadChunkSize === 'number') {
      result.uploadChunkSize = copy.uploadChunkSize
    }
  }

  /**
   * Add env var overrides
   */
  // Cap the uploadConcurrency at 32
  result.uploadConcurrency = !isNaN(
    Number(process.env['CACHE_UPLOAD_CONCURRENCY'])
  )
    ? Math.min(32, Number(process.env['CACHE_UPLOAD_CONCURRENCY']))
    : result.uploadConcurrency
  // Cap the uploadChunkSize at 128MiB
  result.uploadChunkSize = !isNaN(
    Number(process.env['CACHE_UPLOAD_CHUNK_SIZE'])
  )
    ? Math.min(
        128 * 1024 * 1024,
        Number(process.env['CACHE_UPLOAD_CHUNK_SIZE']) * 1024 * 1024
      )
    : result.uploadChunkSize

  core.debug(`Use Azure SDK: ${result.useAzureSdk}`)
  core.debug(`Upload concurrency: ${result.uploadConcurrency}`)
  core.debug(`Upload chunk size: ${result.uploadChunkSize}`)

  return result
}

/**
 * Returns a copy of the download options with defaults filled in.
 *
 * @param copy the original download options
 */
export function getDownloadOptions(copy?: DownloadOptions): DownloadOptions {
  const result: DownloadOptions = {
    useAzureSdk: false,
    concurrentBlobDownloads: true,
    downloadConcurrency: 8,
    timeoutInMs: 30000,
    segmentTimeoutInMs: 600000,
    lookupOnly: false
  }

  if (copy) {
    if (typeof copy.useAzureSdk === 'boolean') {
      result.useAzureSdk = copy.useAzureSdk
    }

    if (typeof copy.concurrentBlobDownloads === 'boolean') {
      result.concurrentBlobDownloads = copy.concurrentBlobDownloads
    }

    if (typeof copy.downloadConcurrency === 'number') {
      result.downloadConcurrency = copy.downloadConcurrency
    }

    if (typeof copy.timeoutInMs === 'number') {
      result.timeoutInMs = copy.timeoutInMs
    }

    if (typeof copy.segmentTimeoutInMs === 'number') {
      result.segmentTimeoutInMs = copy.segmentTimeoutInMs
    }

    if (typeof copy.lookupOnly === 'boolean') {
      result.lookupOnly = copy.lookupOnly
    }
  }
  const segmentDownloadTimeoutMins =
    process.env['SEGMENT_DOWNLOAD_TIMEOUT_MINS']

  if (
    segmentDownloadTimeoutMins &&
    !isNaN(Number(segmentDownloadTimeoutMins)) &&
    isFinite(Number(segmentDownloadTimeoutMins))
  ) {
    result.segmentTimeoutInMs = Number(segmentDownloadTimeoutMins) * 60 * 1000
  }
  core.debug(`Use Azure SDK: ${result.useAzureSdk}`)
  core.debug(`Download concurrency: ${result.downloadConcurrency}`)
  core.debug(`Request timeout (ms): ${result.timeoutInMs}`)
  core.debug(
    `Cache segment download timeout mins env var: ${process.env['SEGMENT_DOWNLOAD_TIMEOUT_MINS']}`
  )
  core.debug(`Segment download timeout (ms): ${result.segmentTimeoutInMs}`)
  core.debug(`Lookup only: ${result.lookupOnly}`)

  return result
}
