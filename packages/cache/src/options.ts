import * as core from '@actions/core'

/**
 * Options to control cache upload
 */
export interface UploadOptions {
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
   * Maximum time for each download request, in milliseconds (this
   * option only applies when using the Azure SDK)
   *
   * @default 30000
   */
  timeoutInMs?: number
}

/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
export function getUploadOptions(copy?: UploadOptions): UploadOptions {
  const result: UploadOptions = {
    uploadConcurrency: 4,
    uploadChunkSize: 32 * 1024 * 1024
  }

  if (copy) {
    if (typeof copy.uploadConcurrency === 'number') {
      result.uploadConcurrency = copy.uploadConcurrency
    }

    if (typeof copy.uploadChunkSize === 'number') {
      result.uploadChunkSize = copy.uploadChunkSize
    }
  }

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
    useAzureSdk: true,
    downloadConcurrency: 8,
    timeoutInMs: 30000
  }

  if (copy) {
    if (typeof copy.useAzureSdk === 'boolean') {
      result.useAzureSdk = copy.useAzureSdk
    }

    if (typeof copy.downloadConcurrency === 'number') {
      result.downloadConcurrency = copy.downloadConcurrency
    }

    if (typeof copy.timeoutInMs === 'number') {
      result.timeoutInMs = copy.timeoutInMs
    }
  }

  core.debug(`Use Azure SDK: ${result.useAzureSdk}`)
  core.debug(`Download concurrency: ${result.downloadConcurrency}`)
  core.debug(`Request timeout (ms): ${result.timeoutInMs}`)

  return result
}
