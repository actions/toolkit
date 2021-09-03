import * as core from '@actions/core'
import {GlobOptions} from './internal-glob-options'

/**
 * Returns a copy with defaults filled in.
 */
export function getOptions(copy?: GlobOptions): GlobOptions {
  const result: GlobOptions = {
    followSymbolicLinks: true,
    implicitDescendants: true,
    matchDirectories: true,
    omitBrokenSymbolicLinks: true
  }

  if (copy) {
    if (typeof copy.followSymbolicLinks === 'boolean') {
      result.followSymbolicLinks = copy.followSymbolicLinks
      core.debug(`followSymbolicLinks '${result.followSymbolicLinks}'`)
    }

    if (typeof copy.implicitDescendants === 'boolean') {
      result.implicitDescendants = copy.implicitDescendants
      core.debug(`implicitDescendants '${result.implicitDescendants}'`)
    }

    if (typeof copy.matchDirectories === 'boolean') {
      result.matchDirectories = copy.matchDirectories
      core.debug(`matchDirectories '${result.matchDirectories}'`)
    }

    if (typeof copy.omitBrokenSymbolicLinks === 'boolean') {
      result.omitBrokenSymbolicLinks = copy.omitBrokenSymbolicLinks
      core.debug(`omitBrokenSymbolicLinks '${result.omitBrokenSymbolicLinks}'`)
    }
  }

  return result
}
