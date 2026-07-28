/**
 * Options to control globbing behavior
 */
export interface HashFileOptions {
  /**
   * Indicates whether to follow symbolic links. Generally should set to false
   * when deleting files.
   *
   * @default true
   */
  followSymbolicLinks?: boolean

  /**
   * Array of allowed root directories. Only files that resolve under one of
   * these roots will be included in the hash.
   *
   * @default [GITHUB_WORKSPACE]
   */
  roots?: string[]

  /**
   * Indicates whether files outside the allowed roots should be included.
   * If false, outside-root files are skipped with a warning.
   *
   * @default false
   */
  allowFilesOutsideWorkspace?: boolean

  /**
   * Array of glob patterns for files to exclude from hashing.
   *
   * @default []
   */
  exclude?: string[]
}
