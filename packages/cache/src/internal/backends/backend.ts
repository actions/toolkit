import {DownloadOptions, UploadOptions} from '../../options.js'

export interface CacheBackend {
  isAvailable(): boolean
  restoreCache(
    paths: string[],
    primaryKey: string,
    restoreKeys?: string[],
    options?: DownloadOptions,
    enableCrossOsArchive?: boolean
  ): Promise<string | undefined>
  saveCache(
    paths: string[],
    key: string,
    options?: UploadOptions,
    enableCrossOsArchive?: boolean
  ): Promise<number>
}
