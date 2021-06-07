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
}
