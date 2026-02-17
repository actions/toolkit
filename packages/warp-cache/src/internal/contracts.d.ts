import {CompressionMethod} from './constants'
import {TypedResponse} from '@actions/http-client/lib/interfaces'
import {HttpClientError} from '@actions/http-client'

export interface ITypedResponseWithError<T> extends TypedResponse<T> {
  error?: HttpClientError
}

export interface InternalCacheOptions {
  compressionMethod?: CompressionMethod
  enableCrossOsArchive?: boolean
  enableCrossArchArchive?: boolean
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
