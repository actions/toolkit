import {CompressionMethod} from './constants';

export interface ArtifactCacheEntry {
  cacheKey?: string;
  scope?: string;
  creationTime?: string;
  archiveLocation?: string;
}

export interface CommitCacheRequest {
  size: number;
}

export interface ReserveCacheRequest {
  key: string;
  version?: string;
}

export interface ReserveCacheResponse {
  cacheId: number;
}

export interface InternalCacheOptions {
  compressionMethod?: CompressionMethod;
}
