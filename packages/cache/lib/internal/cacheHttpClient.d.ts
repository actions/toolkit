import { S3ClientConfig } from '@aws-sdk/client-s3';
import { CompressionMethod } from './constants';
import { ArtifactCacheEntry, InternalCacheOptions } from './contracts';
import { DownloadOptions, UploadOptions } from '../options';
export declare function getCacheVersion(paths: string[], compressionMethod?: CompressionMethod): string;
export declare function getCacheEntry(keys: string[], paths: string[], options?: InternalCacheOptions, s3Options?: S3ClientConfig, s3BucketName?: string): Promise<ArtifactCacheEntry | null>;
export declare function downloadCache(cacheEntry: ArtifactCacheEntry, archivePath: string, options?: DownloadOptions, s3Options?: S3ClientConfig, s3BucketName?: string): Promise<void>;
export declare function reserveCache(key: string, paths: string[], options?: InternalCacheOptions, s3Options?: S3ClientConfig, s3BucketName?: string): Promise<number>;
export declare function saveCache(cacheId: number, archivePath: string, key: string, options?: UploadOptions, s3Options?: S3ClientConfig, s3BucketName?: string): Promise<void>;
