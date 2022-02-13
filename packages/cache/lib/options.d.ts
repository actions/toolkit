/**
 * Options to control cache upload
 */
export interface UploadOptions {
    /**
     * Number of parallel cache upload
     *
     * @default 4
     */
    uploadConcurrency?: number;
    /**
     * Maximum chunk size in bytes for cache upload
     *
     * @default 32MB
     */
    uploadChunkSize?: number;
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
    useAzureSdk?: boolean;
    /**
     * Number of parallel downloads (this option only applies when using
     * the Azure SDK)
     *
     * @default 8
     */
    downloadConcurrency?: number;
    /**
     * Maximum time for each download request, in milliseconds (this
     * option only applies when using the Azure SDK)
     *
     * @default 30000
     */
    timeoutInMs?: number;
}
/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
export declare function getUploadOptions(copy?: UploadOptions): UploadOptions;
/**
 * Returns a copy of the download options with defaults filled in.
 *
 * @param copy the original download options
 */
export declare function getDownloadOptions(copy?: DownloadOptions): DownloadOptions;
