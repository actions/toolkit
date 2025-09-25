import {extractZip, extract7z, extractTar, extractXar} from '../tool-cache'

abstract class ArchiveBase {
  abstract type: 'zip' | 'tar' | '7z' | 'xar'
  path: string

  constructor(path: string) {
    this.path = path
  }

  abstract extract(
    dest?: string,
    flags?: string | string[] | undefined
  ): Promise<string>
}

export class ZipArchive extends ArchiveBase {
  type: 'zip' = 'zip'

  constructor(public path: string) {
    super(path)
  }

  async extract(dest?: string): Promise<string> {
    return await extractZip(this.path, dest)
  }
}

export class TarArchive extends ArchiveBase {
  type: 'tar' = 'tar'

  constructor(public path: string) {
    super(path)
  }

  async extract(
    dest?: string,
    flags?: string | string[] | undefined
  ): Promise<string> {
    return await extractTar(this.path, dest, flags)
  }
}

export class SevenZipArchive extends ArchiveBase {
  type: '7z' = '7z'

  constructor(public path: string) {
    super(path)
  }

  async extract(dest?: string, _7zPath?: string | undefined): Promise<string> {
    return await extract7z(this.path, dest, _7zPath)
  }
}

export class XarArchive extends ArchiveBase {
  type: 'xar' = 'xar'

  constructor(public path: string) {
    super(path)
  }

  async extract(
    dest?: string,
    flags?: string | string[] | undefined
  ): Promise<string> {
    return await extractXar(this.path, dest, flags)
  }
}

export type Archive = ZipArchive | TarArchive | SevenZipArchive | XarArchive

// Helpers

export const isZipArchive = (archive: Archive): archive is ZipArchive =>
  archive.type === 'zip'
export const isTarArchive = (archive: Archive): archive is TarArchive =>
  archive.type === 'tar'
export const isSevenZipArchive = (
  archive: Archive
): archive is SevenZipArchive => archive.type === '7z'
export const isXarArchive = (archive: Archive): archive is XarArchive =>
  archive.type === 'xar'
