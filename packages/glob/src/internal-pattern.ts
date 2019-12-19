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
  searchPath: string = ''
  private minimatch: IMinimatch
  private rootRegExp: RegExp
  private trailingSlash: boolean = false

  constructor(pattern: string) {
    pattern = pattern || ''

    // Comment
    if (pattern.startsWith('#')) {
      this.comment = true
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

    // Trailing slash indicates the pattern should only match directories, not regular files
    this.trailingSlash = pathHelper
      .normalizeSeparators(pattern)
      .endsWith(path.sep)

    // Store the root segment (required when determining partial match)
    const rootSegment = new Path(pattern).segments[0]
    this.rootRegExp = new RegExp(
      this.regExpEscape(rootSegment),
      IS_WINDOWS ? 'i' : ''
    )

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

  private regExpEscape(s: string): string {
    return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
  }
}
