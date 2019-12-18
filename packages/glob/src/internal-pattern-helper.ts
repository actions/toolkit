import * as core from '@actions/core'
import * as pathHelper from './internal-path-helper'
import {IGlobOptions} from './internal-glob-options'
import {MatchKind} from './internal-match-kind'
import {Pattern} from './internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Returns a copy with defaults filled in
 */
export function getOptions(copy?: IGlobOptions): IGlobOptions {
  const result: IGlobOptions = {
    followSymbolicLinks: true,
    implicitDescendants: true,
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

    if (typeof copy.omitBrokenSymbolicLinks === 'boolean') {
      result.omitBrokenSymbolicLinks = copy.omitBrokenSymbolicLinks
      core.debug(`omitBrokenSymbolicLinks '${result.omitBrokenSymbolicLinks}'`)
    }
  }

  return result
}

/**
 * Given an array of patterns, returns an array of paths to search.
 * Duplicates and paths under other included paths are filtered out.
 */
export function getSearchPaths(patterns: Pattern[]): string[] {
  // Ignore negate patterns
  patterns = patterns.filter(x => !x.negate)

  // Create a map of all search paths
  const searchPathMap: {[key: string]: string} = {}
  for (const pattern of patterns) {
    const key = IS_WINDOWS
      ? pattern.searchPath.toUpperCase()
      : pattern.searchPath
    searchPathMap[key] = 'candidate'
  }

  const result: string[] = []

  for (const pattern of patterns) {
    // Check if already included
    const key = IS_WINDOWS
      ? pattern.searchPath.toUpperCase()
      : pattern.searchPath
    if (searchPathMap[key] === 'included') {
      continue
    }

    // Check for an ancestor search path
    let foundAncestor = false
    let tempKey = key
    let parent = pathHelper.dirname(tempKey)
    while (parent !== tempKey) {
      if (searchPathMap[parent]) {
        foundAncestor = true
        break
      }

      tempKey = parent
      parent = pathHelper.dirname(tempKey)
    }

    // Include the search pattern in the result
    if (!foundAncestor) {
      result.push(pattern.searchPath)
      searchPathMap[key] = 'included'
    }
  }

  return result
}

/**
 * Matches the patterns against the path
 */
export function match(patterns: Pattern[], itemPath: string): MatchKind {
  let result: MatchKind = MatchKind.None

  for (const pattern of patterns) {
    if (pattern.negate) {
      result &= ~pattern.match(itemPath)
    } else {
      result |= pattern.match(itemPath)
    }
  }

  return result
}

/**
 * Parses the pattern strings into Pattern objects
 */
export function parse(patterns: string[], options: IGlobOptions): Pattern[] {
  const result: Pattern[] = []

  for (const patternString of patterns.map(x => x.trim())) {
    // Skip empty or comment
    if (!patternString || patternString.startsWith('#')) {
      continue
    }

    // Push
    const pattern = new Pattern(patternString)
    result.push(pattern)

    // Implicit descendants?
    if (
      options.implicitDescendants &&
      (pattern.trailingSeparator ||
        pattern.segments[pattern.segments.length - 1] !== '**')
    ) {
      // Push
      result.push(new Pattern(pattern.negate, pattern.segments.concat('**')))
    }
  }

  return result
}

/**
 * Checks whether to descend further into the directory
 */
export function partialMatch(patterns: Pattern[], itemPath: string): boolean {
  return patterns.some(x => !x.negate && x.partialMatch(itemPath))
}
