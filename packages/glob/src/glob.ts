import {Globber, DefaultGlobber} from './internal-globber'
import {GlobOptions} from './internal-glob-options'
import {HashFileOptions} from './internal-hash-file-options'
import {hashFiles as _hashFiles} from './internal-hash-files'

export {Globber, GlobOptions}

/**
 * Constructs a globber
 *
 * @param patterns  Patterns separated by newlines
 * @param options   Glob options
 */
export async function create(
  patterns: string,
  options?: GlobOptions
): Promise<Globber> {
  return await DefaultGlobber.create(patterns, options)
}

/**
 * Computes the sha256 hash of a glob
 *
 * @param patterns  Patterns separated by newlines
 * @param options   Glob options
 */
export async function hashFiles(
  patterns: string,
  options?: HashFileOptions,
  verbose: Boolean = false
): Promise<string> {
  let followSymbolicLinks = true
  if (options && typeof options.followSymbolicLinks === 'boolean') {
    followSymbolicLinks = options.followSymbolicLinks
  }
  const globber = await create(patterns, {followSymbolicLinks})
  return _hashFiles(globber, verbose)
}
