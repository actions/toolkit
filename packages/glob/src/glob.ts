import {Pattern} from './internal-pattern-helpers'

/**
 * Properties to control glob behavior
 */
export class GlobOptions {
  /**
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * Default is true.
   */
  omitBrokenSymbolicLinks: boolean = true

  /**
   * Indicates whether to follow symbolic links. Generally should be true
   * unless deleting files.
   *
   * Default is true.
   */
  followSymbolicLinks: boolean = true

  /**
   * Indicates whether directories that match the glob pattern, should cause
   * all descendant paths to be included in the result set also.
   *
   * For example, given the directory 'my-dir', the following glob patterns
   * would produce the same results: 'my-dir/**', 'my-dir/', 'my-dir'
   *
   * Default is true.
   */
  expandDirectories: boolean = true
}

/**
 * Returns files and directories matching the specified glob pattern.
 */
export async function glob(
  pattern: string,
  options?: GlobOptions
): Promise<string[]> {
  const patternObj = new Pattern(pattern)
  options = options || new GlobOptions()
  throw new Error(`not implemented ${patternObj} ${options}`)
}

/**
 * Returns the search path preceeding the first segment that contains a pattern.
 *
 * For example, '/foo/bar*' returns '/foo'.
 */
export function getSearchPath(pattern: string): string {
  const patternObj = new Pattern(pattern)
  return patternObj.searchPath
}
