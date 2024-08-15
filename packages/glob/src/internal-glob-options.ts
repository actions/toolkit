/**
 * Options to control globbing behavior
 */
export interface GlobOptions {
  /**
   * Indicates whether to follow symbolic links. Generally should set to false
   * when deleting files.
   *
   * @default true
   */
  followSymbolicLinks?: boolean

  /**
   * Indicates whether directories that match a glob pattern, should implicitly
   * cause all descendant paths to be matched.
   *
   * For example, given the directory `my-dir`, the following glob patterns
   * would produce the same results: `my-dir/**`, `my-dir/`, `my-dir`
   *
   * @default true
   */
  implicitDescendants?: boolean

  /**
   * Indicates whether matching directories should be included in the
   * result set.
   *
   * @default true
   */
  matchDirectories?: boolean

  /**
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * @default true
   */
  omitBrokenSymbolicLinks?: boolean

  /**
   * Indicates whether to exclude hidden files (files and directories starting with a `.`).
   * This does not apply to Windows files and directories with the hidden attribute unless
   * they are also prefixed with a `.`.
   *
   * @default false
   */
  excludeHiddenFiles?: boolean
}
