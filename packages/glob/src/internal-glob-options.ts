export interface IGlobOptions {
  /**
   * Indicates whether to follow symbolic links. Generally should be true
   * unless deleting files.
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
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * @default true
   */
  omitBrokenSymbolicLinks?: boolean
}
