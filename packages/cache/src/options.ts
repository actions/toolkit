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
   * Indicates whether to use the Azure Blob SDK to download
   * caches that are stored on Azure Blob Storage. This option
   * provides better reliability and performance.
   *
   * @default true
   */
  useAzureSdk?: boolean

  /**
   * Number of parallel downloads. This option only applies when
   * using the Azure SDK.
   * 
   * @default 8
   */
  downloadConcurrency?: number

  /**
   * Maximum time for each download request, in milliseconds. This
   * option only applies when using the Azure SDK.
   * 
   * @default 30000
   */
  timeoutInMs?: number
}