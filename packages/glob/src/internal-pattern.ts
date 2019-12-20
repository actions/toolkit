import * as assert from 'assert'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'
import {Minimatch, IMinimatch, IOptions as IMinimatchOptions} from 'minimatch'
import {MatchResult} from './internal-match-result'
import {Path} from './internal-path'

const IS_WINDOWS = process.platform === 'win32'

export class Pattern {
  comment: boolean = false
  negate: boolean = false
  searchPath: string
  private minimatch: IMinimatch
  private rootRegExp: RegExp
  private trailingSlash: boolean = false

  constructor(pattern: string) {
    pattern = pattern || ''

    // Comment
    if (pattern.startsWith('#')) {
      this.comment = true
      this.searchPath = (undefined as unknown) as string
      this.minimatch = (undefined as unknown) as IMinimatch
      this.rootRegExp = (undefined as unknown) as RegExp
      return
    }

    // Negate
    while (pattern.startsWith('!')) {
      this.negate = !this.negate
      pattern = pattern.substr(1)
    }

    // Empty
    assert(pattern, 'pattern cannot be empty')

    // On Windows, do not allow paths like C: and C:foo (for simplicity)
    assert(
      !IS_WINDOWS || !/^([A-Z]:|[A-Z]:[^\\/].*)$/i.test(pattern),
      `The pattern '${pattern}' uses an unsupported root-directory prefix. When a drive letter is specified, use absolute path syntax.`
    )

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

    // Normalize slashes
    pattern = pathHelper.normalizeSeparators(pattern)

    // Trailing slash indicates the pattern should only match directories, not regular files
    this.trailingSlash = pathHelper
      .normalizeSeparators(pattern)
      .endsWith(path.sep)
    pattern = pathHelper.safeTrimTrailingSeparator(pattern)

    // Set search path
    // Set root regexp
    this.searchPath = (undefined as unknown) as string
    this.rootRegExp = (undefined as unknown) as RegExp
    this.initializePaths(pattern)

    // Create minimatch
    const minimatchOptions: IMinimatchOptions = {
      dot: true,
      nobrace: true,
      nocase: IS_WINDOWS,
      nocomment: true,
      noext: true,
      nonegate: true
    }
    pattern = IS_WINDOWS ? pattern.replace(/\\/g, '/') : pattern
    this.minimatch = new Minimatch(pattern, minimatchOptions)
  }

  /**
   * Matches the pattern against the specified path
   */
  match(itemPath: string): MatchResult {
    if (this.comment) {
      return MatchResult.None
    }

    if (this.minimatch.match(itemPath)) {
      return this.trailingSlash ? MatchResult.Directory : MatchResult.All
    }

    return MatchResult.None
  }

  /**
   * Indicates whether the pattern may match descendants of the specified path
   */
  partialMatch(itemPath: string): boolean {
    if (this.comment) {
      return false
    }

    // matchOne does not handle root path correctly
    if (pathHelper.dirname(itemPath) === itemPath) {
      return this.rootRegExp.test(itemPath)
    }

    return this.minimatch.matchOne(
      itemPath.split(/\/+/),
      this.minimatch.set[0],
      true
    )
  }

  /**
   * Initializes the search path and root regexp
   */
  private initializePaths(pattern: string): void {
    // Parse the pattern as a path
    const patternPath = new Path(pattern)

    // Build the search path
    this.searchPath = ''
    for (const patternSegment of patternPath.segments) {
      // Convert
      const literal = this.convertToLiteral(patternSegment)
      if (!literal) {
        break
      }

      // Append slash
      // Note, this is OK because Pattern.ctor() asserts the path is not like C: or C:foo
      if (this.searchPath && !this.searchPath.endsWith(path.sep)) {
        this.searchPath += path.sep
      }

      // Append literal segment
      this.searchPath += literal
    }

    // Store the root segment (required when determining partial match)
    const rootSegment = new Path(pattern).segments[0]
    this.rootRegExp = new RegExp(
      this.regExpEscape(rootSegment),
      IS_WINDOWS ? 'i' : ''
    )

    // Set the root regexp
    this.rootRegExp = new RegExp(
      this.regExpEscape(this.convertToLiteral(patternPath.segments[0]))
    )
  }

  /**
   * Attempts to unescape a pattern segment to create a literal path segment.
   * Otherwise returns empty string.
   */
  private convertToLiteral(segment: string): string {
    let literal = ''
    for (let i = 0; i < segment.length; i++) {
      const c = segment[i]
      // Escape
      if (c === '\\' && !IS_WINDOWS && i + 1 < segment.length) {
        literal += segment[++i]
        continue
      }
      // Wildcard
      else if (c === '*' || c === '?') {
        return ''
      }
      // Character set
      else if (c === '[' && i + 1 < segment.length) {
        let set = ''
        let closed = -1
        for (let i2 = i + 1; i2 < segment.length; i2++) {
          const c2 = segment[i2]
          // Escape
          if (c2 === '\\' && !IS_WINDOWS && i2 + 1 < segment.length) {
            set += segment[++i2]
            continue
          }
          // Closed
          else if (c2 === ']') {
            closed = i2
            break
          }
          // Otherwise
          else {
            set += c2
          }
        }

        // Closed?
        if (closed >= 0) {
          // Cannot convert
          if (set.length > 1 || set === '!') {
            return ''
          }

          // Convert to literal
          literal += set
          i = closed
          continue
        }

        // Otherwise fall thru
      }

      // Append
      literal += c
    }

    return literal
  }

  /**
   * Escapes regexp special characters
   * https://javascript.info/regexp-escaping
   */
  private regExpEscape(s: string): string {
    return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
  }
}
