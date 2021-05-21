import * as os from 'os'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'
import assert from 'assert'
import {Minimatch, IMinimatch, IOptions as IMinimatchOptions} from 'minimatch'
import {MatchKind} from './internal-match-kind'
import {Path} from './internal-path'

const IS_WINDOWS = process.platform === 'win32'

export class Pattern {
  /**
   * Indicates whether matches should be excluded from the result set
   */
  readonly negate: boolean = false

  /**
   * The directory to search. The literal path prior to the first glob segment.
   */
  readonly searchPath: string

  /**
   * The path/pattern segments. Note, only the first segment (the root directory)
   * may contain a directory separator character. Use the trailingSeparator field
   * to determine whether the pattern ended with a trailing slash.
   */
  readonly segments: string[]

  /**
   * Indicates the pattern should only match directories, not regular files.
   */
  readonly trailingSeparator: boolean

  /**
   * The Minimatch object used for matching
   */
  private readonly minimatch: IMinimatch

  /**
   * Used to workaround a limitation with Minimatch when determining a partial
   * match and the path is a root directory. For example, when the pattern is
   * `/foo/**` or `C:\foo\**` and the path is `/` or `C:\`.
   */
  private readonly rootRegExp: RegExp

  /**
   * Indicates that the pattern is implicitly added as opposed to user specified.
   */
  private readonly isImplicitPattern: boolean

  constructor(pattern: string)
  constructor(
    pattern: string,
    isImplicitPattern: boolean,
    segments: undefined,
    homedir: string
  )
  constructor(
    negate: boolean,
    isImplicitPattern: boolean,
    segments: string[],
    homedir?: string
  )
  constructor(
    patternOrNegate: string | boolean,
    isImplicitPattern = false,
    segments?: string[],
    homedir?: string
  ) {
    // Pattern overload
    let pattern: string
    if (typeof patternOrNegate === 'string') {
      pattern = patternOrNegate.trim()
    }
    // Segments overload
    else {
      // Convert to pattern
      segments = segments || []
      assert(segments.length, `Parameter 'segments' must not empty`)
      const root = Pattern.getLiteral(segments[0])
      assert(
        root && pathHelper.hasAbsoluteRoot(root),
        `Parameter 'segments' first element must be a root path`
      )
      pattern = new Path(segments).toString().trim()
      if (patternOrNegate) {
        pattern = `!${pattern}`
      }
    }

    // Negate
    while (pattern.startsWith('!')) {
      this.negate = !this.negate
      pattern = pattern.substr(1).trim()
    }

    // Normalize slashes and ensures absolute root
    pattern = Pattern.fixupPattern(pattern, homedir)

    // Segments
    this.segments = new Path(pattern).segments

    // Trailing slash indicates the pattern should only match directories, not regular files
    this.trailingSeparator = pathHelper
      .normalizeSeparators(pattern)
      .endsWith(path.sep)
    pattern = pathHelper.safeTrimTrailingSeparator(pattern)

    // Search path (literal path prior to the first glob segment)
    let foundGlob = false
    const searchSegments = this.segments
      .map(x => Pattern.getLiteral(x))
      .filter(x => !foundGlob && !(foundGlob = x === ''))
    this.searchPath = new Path(searchSegments).toString()

    // Root RegExp (required when determining partial match)
    this.rootRegExp = new RegExp(
      Pattern.regExpEscape(searchSegments[0]),
      IS_WINDOWS ? 'i' : ''
    )

    this.isImplicitPattern = isImplicitPattern

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
  match(itemPath: string): MatchKind {
    // Last segment is globstar?
    if (this.segments[this.segments.length - 1] === '**') {
      // Normalize slashes
      itemPath = pathHelper.normalizeSeparators(itemPath)

      // Append a trailing slash. Otherwise Minimatch will not match the directory immediately
      // preceding the globstar. For example, given the pattern `/foo/**`, Minimatch returns
      // false for `/foo` but returns true for `/foo/`. Append a trailing slash to handle that quirk.
      if (!itemPath.endsWith(path.sep) && this.isImplicitPattern === false) {
        // Note, this is safe because the constructor ensures the pattern has an absolute root.
        // For example, formats like C: and C:foo on Windows are resolved to an absolute root.
        itemPath = `${itemPath}${path.sep}`
      }
    } else {
      // Normalize slashes and trim unnecessary trailing slash
      itemPath = pathHelper.safeTrimTrailingSeparator(itemPath)
    }

    // Match
    if (this.minimatch.match(itemPath)) {
      return this.trailingSeparator ? MatchKind.Directory : MatchKind.All
    }

    return MatchKind.None
  }

  /**
   * Indicates whether the pattern may match descendants of the specified path
   */
  partialMatch(itemPath: string): boolean {
    // Normalize slashes and trim unnecessary trailing slash
    itemPath = pathHelper.safeTrimTrailingSeparator(itemPath)

    // matchOne does not handle root path correctly
    if (pathHelper.dirname(itemPath) === itemPath) {
      return this.rootRegExp.test(itemPath)
    }

    return this.minimatch.matchOne(
      itemPath.split(IS_WINDOWS ? /\\+/ : /\/+/),
      this.minimatch.set[0],
      true
    )
  }

  /**
   * Escapes glob patterns within a path
   */
  static globEscape(s: string): string {
    return (IS_WINDOWS ? s : s.replace(/\\/g, '\\\\')) // escape '\' on Linux/macOS
      .replace(/(\[)(?=[^/]+\])/g, '[[]') // escape '[' when ']' follows within the path segment
      .replace(/\?/g, '[?]') // escape '?'
      .replace(/\*/g, '[*]') // escape '*'
  }

  /**
   * Normalizes slashes and ensures absolute root
   */
  private static fixupPattern(pattern: string, homedir?: string): string {
    // Empty
    assert(pattern, 'pattern cannot be empty')

    // Must not contain `.` segment, unless first segment
    // Must not contain `..` segment
    const literalSegments = new Path(pattern).segments.map(x =>
      Pattern.getLiteral(x)
    )
    assert(
      literalSegments.every((x, i) => (x !== '.' || i === 0) && x !== '..'),
      `Invalid pattern '${pattern}'. Relative pathing '.' and '..' is not allowed.`
    )

    // Must not contain globs in root, e.g. Windows UNC path \\foo\b*r
    assert(
      !pathHelper.hasRoot(pattern) || literalSegments[0],
      `Invalid pattern '${pattern}'. Root segment must not contain globs.`
    )

    // Normalize slashes
    pattern = pathHelper.normalizeSeparators(pattern)

    // Replace leading `.` segment
    if (pattern === '.' || pattern.startsWith(`.${path.sep}`)) {
      pattern = Pattern.globEscape(process.cwd()) + pattern.substr(1)
    }
    // Replace leading `~` segment
    else if (pattern === '~' || pattern.startsWith(`~${path.sep}`)) {
      homedir = homedir || os.homedir()
      assert(homedir, 'Unable to determine HOME directory')
      assert(
        pathHelper.hasAbsoluteRoot(homedir),
        `Expected HOME directory to be a rooted path. Actual '${homedir}'`
      )
      pattern = Pattern.globEscape(homedir) + pattern.substr(1)
    }
    // Replace relative drive root, e.g. pattern is C: or C:foo
    else if (
      IS_WINDOWS &&
      (pattern.match(/^[A-Z]:$/i) || pattern.match(/^[A-Z]:[^\\]/i))
    ) {
      let root = pathHelper.ensureAbsoluteRoot(
        'C:\\dummy-root',
        pattern.substr(0, 2)
      )
      if (pattern.length > 2 && !root.endsWith('\\')) {
        root += '\\'
      }
      pattern = Pattern.globEscape(root) + pattern.substr(2)
    }
    // Replace relative root, e.g. pattern is \ or \foo
    else if (IS_WINDOWS && (pattern === '\\' || pattern.match(/^\\[^\\]/))) {
      let root = pathHelper.ensureAbsoluteRoot('C:\\dummy-root', '\\')
      if (!root.endsWith('\\')) {
        root += '\\'
      }
      pattern = Pattern.globEscape(root) + pattern.substr(1)
    }
    // Otherwise ensure absolute root
    else {
      pattern = pathHelper.ensureAbsoluteRoot(
        Pattern.globEscape(process.cwd()),
        pattern
      )
    }

    return pathHelper.normalizeSeparators(pattern)
  }

  /**
   * Attempts to unescape a pattern segment to create a literal path segment.
   * Otherwise returns empty string.
   */
  private static getLiteral(segment: string): string {
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
          if (set.length > 1) {
            return ''
          }

          // Convert to literal
          if (set) {
            literal += set
            i = closed
            continue
          }
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
  private static regExpEscape(s: string): string {
    return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
  }
}
