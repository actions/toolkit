import * as pathHelper from './internal-path-helper'
import {IGlobOptions} from './internal-glob-options'
import {MatchResult} from './internal-match-result'
import {Pattern} from './internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

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
  let result: MatchResult = MatchResult.None

  for (const pattern of patterns) {
    if (pattern.comment) {
      continue
    }

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
    // Parse
    const pattern = new Pattern(patternString)

    // Comment
    if (pattern.comment) {
      continue
    }

    // Push
    result.push(pattern)

    // Implicitly match descendant paths
    if (options.implicitDescendants && !endsWithGlobstar(patternString)) {
      // Ensure trailing slash
      // Note, this is OK because Pattern.ctor() asserts the path is not like C: or C:foo
      if (IS_WINDOWS) {
        if (!patternString.endsWith('/') && !patternString.endsWith('\\')) {
          patternString += '\\'
        }
      } else {
        if (!patternString.endsWith('/')) {
          patternString += '/'
        }
      }

      // Append globstar
      patternString += '**'

      // Push
      result.push(new Pattern(patternString))
    }
  }

  return result
}

/**
 * Checks whether to descend further into the directory
 */
export function partialMatch(patterns: Pattern[], itemPath: string): boolean {
  return patterns.some(x => !x.comment && !x.negate && x.partialMatch(itemPath))
}

/**
 * Determines whether the pattern ends with globstar
 */
function endsWithGlobstar(pattern: string): boolean {
  if (pattern === '**' || pattern.endsWith('/**')) {
    return true
  } else if (IS_WINDOWS && pattern.endsWith('\\**')) {
    return true
  }

  return false
}
