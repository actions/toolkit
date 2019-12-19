import * as assert from 'assert'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'
import {Minimatch, IOptions as MinimatchOptions} from 'minimatch'
import {Path} from './internal-path-helper'

const IS_WINDOWS = process.platform === 'win32'

export enum MatchResult {
  /** Match failed */
  Failed,

  /** Match succeeded */
  Succeeded,

  /** Match succeeded only if the path is a directory */
  Directory,
}

export class Pattern {
  comment: boolean = false
  negate: boolean = false
  searchPath: string = ''
  segments: PatternSegment[] = []
  trailingSlash: boolean = false

  constructor(pattern: string) {
    pattern = pattern || ''

    // Comment
    if (pattern.startsWith('#')) {
      this.comment = true
      return
    }

    // Negate
    while (pattern.startsWith('!')) {
      this.negate = !this.negate
      pattern = pattern.substr(1)
    }

    // Empty pattern
    assert(pattern, 'pattern cannot be empty')

    // Root the pattern
    if (!pathHelper.isRooted(pattern)) {
      // Escape glob characters
      let root = process.cwd()
      root = (IS_WINDOWS ? root : root.replace(/\\/g, '\\\\')) // escape '\' on Linux/macOS
        .replace(/(\[)(?=[^/]+\])/g, '[[]') // escape '[' when ']' follows within the path segment
        .replace(/\?/g, '[?]') // escape '?'
        .replace(/\*/g, '[*]') // escape '*'
      pattern = pathHelper.ensureRooted(root, pattern)
    }

    // Trailing slash indicates the pattern should only match directories, not regular files
    this.trailingSlash = pathHelper
      .normalizeSeparators(pattern)
      .endsWith(path.sep)

    // Create pattern segments
    const parsedPath = new Path(pattern)
    this.segments = parsedPath.segments.map(x => new PatternSegment(x))

    // // Push all segments, while not at the root
    // let dirname = pathHelpers.dirname(pattern)
    // while (dirname !== pattern) {
    //   // Push the segment
    //   const basename = path.basename(pattern)
    //   if (basename !== '.') {
    //     assert(
    //       basename !== '..',
    //       `Path segment '..' is invalid in match pattern '${originalPattern}'`
    //     )
    //     this.segments.push(new PatternSegment(basename))
    //   }

    //   // Truncate the last segment
    //   pattern = dirname
    //   dirname = pathHelpers.dirname(pattern)
    // }

    // // Remainder is the root
    // this.searchPath = pattern

    // // Remove leading literal segments and build search path
    // while (this.segments.length > 0 && this.segments[0].literal) {
    //   this.searchPath = path.join(this.searchPath, this.segments[0].literal)
    //   this.segments.splice(0, 1)
    // }
  }
}

export class PatternSegment {
  literal: string = ''
  regexp: RegExp | undefined
  globstar: boolean = false

  constructor(segment: string) {
    // Root segment
    if (segment.includes('/')) {
      this.literal = segment
    }
    // Globstar
    else if (segment === '**') {
      this.globstar = true
      this.regexp = /^(.*)?$/
    }
    // Windows
    else if (IS_WINDOWS) {
      // Try case sensitive
      let expression = this.getExpression(segment)
      if (typeof expression === 'string') {
        this.literal = expression
      }

      // Try case insensitive
      expression = this.getExpression(segment, true)
      if (typeof expression === 'object') {
        this.regexp = expression
      }
    }
    // Linux/macOS
    else {
      // Set literal or regex
      const expression = this.getExpression(segment)
      if (typeof expression === 'string') {
        this.literal = expression
      } else {
        this.regexp = expression
      }
    }

    // Always set regexp
    if (!this.regexp) {
      assert(
        this.literal,
        `Unexpected expression from pattern segment '${segment}'`
      )
      const pattern = `^${this.regExpEscape(this.literal)}$`
      const flags = IS_WINDOWS ? 'i' : ''
      this.regexp = new RegExp(pattern, flags)
    }

    // Validate at least one is set
    assert(
      this.literal || this.regexp,
      `Unexpected expression from pattern segment '${segment}'`
    )
  }

  private getExpression(
    segment: string,
    nocase: boolean = false
  ): string | RegExp {
    const options: MinimatchOptions = {
      dot: true,
      nobrace: true,
      nocase,
      nocomment: true,
      noext: true,
      nonegate: true
    }
    const minimatchObj = new Minimatch(segment, options)
    assert(
      minimatchObj.set.length === 1 && minimatchObj.set[0].length === 1,
      `Unexpected expression from pattern segment '${segment}'`
    )
    return minimatchObj.set[0][0]
  }

  /**
   * Escapes regexp special characters: `[ \ ^ $ . | ? * + ( )`
   * For more information, refer to https://javascript.info/regexp-escaping
   */
  private regExpEscape(s: string): string {
    return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
  }
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

export function match(patterns: Pattern[], itemPath: string): MatchResult {
}

/**
 * Parses the pattern strings into Pattern objects
 */
export function parsePatterns(patterns: string[]): Pattern[] {
  return patterns.map(x => new Pattern(x)).filter(x => !x.comment)
}
