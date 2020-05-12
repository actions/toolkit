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
   * Maximum chunk size for cache upload
   *
   * @default 32MB
   */
  uploadChunkSize?: number
}
