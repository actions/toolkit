import {OutgoingHttpHeaders} from 'http'
import {
  SevenZipArchive,
  TarArchive,
  XarArchive,
  ZipArchive
} from './archive-types'

export type ArchiveType = 'zip' | 'tar' | '7z' | 'xar'

interface RetrieveArchiveOptionsBase {
  downloadPath?: string
  type?: ArchiveType | 'auto'
  auth?: string | undefined
  headers?: OutgoingHttpHeaders | undefined
}

export interface RetrieveZipArchiveOptions extends RetrieveArchiveOptionsBase {
  type: 'zip'
}

export interface RetrieveTarArchiveOptions extends RetrieveArchiveOptionsBase {
  type: 'tar'
}

export interface Retrieve7zArchiveOptions extends RetrieveArchiveOptionsBase {
  type: '7z'
}

export interface RetrieveXarArchiveOptions extends RetrieveArchiveOptionsBase {
  type: 'xar'
}

export interface RetrieveUnknownArchiveOptions
  extends RetrieveArchiveOptionsBase {
  type?: 'auto'
}

export type RetrieveArchiveOptions =
  | RetrieveZipArchiveOptions
  | RetrieveTarArchiveOptions
  | Retrieve7zArchiveOptions
  | RetrieveXarArchiveOptions
  | RetrieveUnknownArchiveOptions

export type PredictTypeByOptions<O extends RetrieveArchiveOptions> =
  O extends RetrieveZipArchiveOptions
    ? ZipArchive
    : O extends Retrieve7zArchiveOptions
    ? SevenZipArchive
    : O extends RetrieveTarArchiveOptions
    ? TarArchive
    : O extends RetrieveXarArchiveOptions
    ? XarArchive
    : ZipArchive | TarArchive | SevenZipArchive | XarArchive
