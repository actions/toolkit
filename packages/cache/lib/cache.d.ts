import { DownloadOptions, UploadOptions } from './options';
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class ReserveCacheError extends Error {
    constructor(message: string);
}
/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
export declare function isFeatureAvailable(): boolean;
/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @param downloadOptions cache download options
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
export declare function restoreCache(paths: string[], primaryKey: string, restoreKeys?: string[], options?: DownloadOptions, blobContainerName?: string, connectionString?: string): Promise<string | undefined>;
/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param options cache upload options
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
export declare function saveCache(paths: string[], key: string, options?: UploadOptions, blobContainerName?: string, connectionString?: string): Promise<number>;
