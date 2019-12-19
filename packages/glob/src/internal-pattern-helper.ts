import * as pathHelper from './internal-path-helper'
import {MatchResult, Pattern} from './internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Checks whether to descend further into the directory
 */
export function descend(patterns: Pattern[], itemPath: string): boolean {
  throw new Error(`not impl ${patterns} ${itemPath}`)
}

/**
 * Given an array of patterns, returns an array of paths to search.
 * Duplicates and paths under other included paths are filtered out.
 */
export function getSearchPaths(patterns: Pattern[]): string[] {
  // Ignore comment and negate patterns
  patterns = patterns.filter(x => !x.comment && !x.negate)

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
export function match(patterns: Pattern[], itemPath: string): MatchResult {
  throw new Error(`not impl ${patterns} ${itemPath}`)
}

/**
 * Parses the pattern strings into Pattern objects
 */
export function parse(patterns: string[]): Pattern[] {
  return patterns.map(x => new Pattern(x)).filter(x => !x.comment)
}
