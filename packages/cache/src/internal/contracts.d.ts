import {CompressionMethod} from './constants'
import {ITypedResponse} from '@actions/http-client/lib/interfaces'
import {HttpClientError} from '@actions/http-client'

export interface ITypedResponseWithError<T> extends ITypedResponse<T> {
  error?: HttpClientError
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
