import {CompressionMethod} from './constants'
import {TypedResponse} from '@actions/http-client/lib/interfaces'
import {HttpClientError} from '@actions/http-client'

export interface ITypedResponseWithError<T> extends TypedResponse<T> {
  error?: HttpClientError
}

export interface ArtifactCacheEntry {
  provider: string
  auth_method: string
  cache_key?: string
  archive_location?: string
  pre_signed_url?: string
  cache_version?: string
}

export interface ArtifactCacheList {
  totalCount: number
  artifactCaches?: ArtifactCacheEntry[]
}

export interface CommitCacheRequest {
  cache_key: string
  cache_version: string
  upload_key: string
  upload_id: string
  parts: InternalS3CompletedPart[]
  os: string
  vcs_type: string
}

export interface CommitCacheResponse {
  cache_key: string
  cache_version: string
}

export interface ReserveCacheRequest {
  cache_key: string
  content_type: string
  number_of_chunks: number
}

export interface ReserveCacheResponse {
  pre_signed_urls: string[]
  upload_key: string
  upload_id: string
}

export interface InternalCacheOptions {
  compressionMethod?: CompressionMethod
  enableCrossOsArchive?: boolean
  cacheSize?: number
}

export interface ArchiveTool {
  path: string
  type: string
}

export interface InternalS3CompletedPart {
  ETag: string
  PartNumber: number
}
