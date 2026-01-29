import {Globber, DefaultGlobber} from './internal-globber.js'
import {GlobOptions} from './internal-glob-options.js'
import {HashFileOptions} from './internal-hash-file-options.js'
import {hashFiles as _hashFiles} from './internal-hash-files.js'

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
 * @param currentWorkspace  Workspace used when matching files
 * @param options   Glob options
 * @param verbose   Enables verbose logging
 */
export async function hashFiles(
  patterns: string,
  currentWorkspace = '',
  options?: HashFileOptions,
  verbose: Boolean = false
): Promise<string> {
  let followSymbolicLinks = true
  if (options && typeof options.followSymbolicLinks === 'boolean') {
    followSymbolicLinks = options.followSymbolicLinks
  }
  const globber = await create(patterns, {followSymbolicLinks})
  return _hashFiles(globber, currentWorkspace, verbose)
}
