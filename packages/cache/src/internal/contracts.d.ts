import {CompressionMethod} from './constants'
import {
  ITypedResponse
} from '@actions/http-client/interfaces'

export interface ITypedResponseWithErrorMessage<T> extends ITypedResponse<T> {
  message?: string
  typeKey?: string
}

export interface ArtifactCacheEntry {
  cacheKey?: string
  scope?: string
  creationTime?: string
  archiveLocation?: string
}

export interface CommitCacheRequest {
  size: number
}

export interface ReserveCacheRequest {
  key: string
  version?: string
  cacheSize?: number
}

export interface ReserveCacheResponse {
  cacheId: number
}

export interface InternalCacheOptions {
  compressionMethod?: CompressionMethod
  cacheSize?: number
}

export interface CommitCacheRequest {
  size: number
}
