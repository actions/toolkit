import {
  ZipArchive,
  TarArchive,
  SevenZipArchive,
  XarArchive
} from './archive-types'
import {downloadTool} from '../tool-cache'
import {getArchiveType} from './get-archive-type'
import {PredictTypeByOptions, RetrieveArchiveOptions} from './types'

export const retrieve = async <O extends RetrieveArchiveOptions>(
  url: string,
  options?: O
): Promise<PredictTypeByOptions<O>> => {
  const path = await downloadTool(
    url,
    options?.downloadPath,
    options?.auth,
    options?.headers
  )

  const archiveType =
    options?.type === 'auto' || !options?.type
      ? await getArchiveType(path)
      : options.type

  switch (archiveType) {
    case 'zip':
      return new ZipArchive(path) as PredictTypeByOptions<O>
    case 'tar':
      return new TarArchive(path) as PredictTypeByOptions<O>
    case '7z':
      return new SevenZipArchive(path) as PredictTypeByOptions<O>
    case 'xar':
      return new XarArchive(path) as PredictTypeByOptions<O>
    default:
      throw new Error(`Unsupported archive type: ${archiveType}`)
  }
}
