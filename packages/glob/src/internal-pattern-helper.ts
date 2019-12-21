import * as pathHelper from './internal-path-helper'
import {IGlobOptions} from './internal-glob-options'
import {MatchKind} from './internal-match-kind'
import {Path} from './internal-path'
import {Pattern} from './internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

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

  for (let patternString of patterns) {
    // Comment
    if (patternString.startsWith('#')) {
      continue
    }

    // Push
    result.push(new Pattern(patternString))

    // Implicitly match descendant paths
    if (options.implicitDescendants) {
      // Trailing globstar?
      const segments = new Path(patternString).segments
      if (segments[segments.length - 1] !== '**') {
        // Push
        segments.push('**')
        patternString = new Path(segments).toString()
        result.push(new Pattern(patternString))
      }
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
