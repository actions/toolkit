import { CompressionMethod } from './constants';
import { ArtifactCacheEntry, InternalCacheOptions, ReserveCacheResponse, ITypedResponseWithError } from './contracts';
import { DownloadOptions, UploadOptions } from '../options';
export declare function getCacheVersion(paths: string[], compressionMethod?: CompressionMethod): string;
export declare function getCacheEntry(keys: string[], paths: string[], options?: InternalCacheOptions, blobContainerName?: string, connectionString?: string): Promise<ArtifactCacheEntry | null>;
export declare function downloadCache(cacheEntry: ArtifactCacheEntry, archivePath: string, options?: DownloadOptions, blobContainerName?: string, connectionString?: string): Promise<void>;
export declare function reserveCache(key: string, paths: string[], options?: InternalCacheOptions): Promise<ITypedResponseWithError<ReserveCacheResponse>>;
export declare function saveCache(cacheId: number, archivePath: string, key: string, options?: UploadOptions, blobContainerName?: string, connectionString?: string): Promise<void>;
