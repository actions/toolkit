import * as assert from 'assert'
import * as minimatch from 'minimatch'
import * as path from 'path'
import * as pathHelpers from './internal-path-helpers'

const IS_WINDOWS = process.platform === 'win32'

export class Pattern {
  comment: boolean = false
  negate: boolean = false
  searchPath: string = ''
  segments: Segment[] = []
  trailingSlash: boolean = false

  constructor(pattern: string) {
    pattern = pattern || ''
    const originalPattern = pattern

    // Determine comment
    if (pattern.startsWith('#')) {
      this.comment = true
      return
    }

    // Determine negate
    while (pattern.startsWith('!')) {
      this.negate = !this.negate
      pattern = pattern.substr(1)
    }

    // Validate not empty
    assert(pattern, 'pattern cannot be empty')

    // Root the pattern
    if (!pathHelpers.isRooted(pattern)) {
      // Escape special glob characters
      let root = process.cwd()
      root = (IS_WINDOWS ? root : root.replace(/\\/g, '\\\\')) // escape '\' on macOS/Linux
        .replace(/(\[)(?=[^/]+\])/g, '[[]') // escape '[' when ']' follows within the path segment
        .replace(/\?/g, '[?]') // escape '?'
        .replace(/\*/g, '[*]') // escape '*'
      pattern = pathHelpers.ensureRooted(root, pattern)
    }

    // Normalize slashes
    pattern = pathHelpers.normalizeSeparators(pattern)

    // Trailing slash indicates the pattern should only match directories, not regular files
    if (pattern.endsWith(path.sep)) {
      this.trailingSlash = true
      pattern = pathHelpers.safeTrimTrailingPathSeparator(pattern)
    }

    // Push all segments, while not at the root
    let dirname = pathHelpers.dirname(pattern)
    while (dirname !== pattern) {
      // Push the segment
      const basename = path.basename(pattern)
      if (basename !== '.') {
        assert(
          basename !== '..',
          `Path segment '..' is invalid in match pattern '${originalPattern}'`
        )
        this.segments.push(new Segment(basename))
      }

      // Truncate the last segment
      pattern = dirname
      dirname = pathHelpers.dirname(pattern)
    }

    // Remainder is the root
    this.searchPath = pattern

    // Remove leading literal segments and build search path
    while (this.segments.length > 0 && this.segments[0].literal) {
      this.searchPath = path.join(this.searchPath, this.segments[0].literal)
      this.segments.splice(0, 1)
    }
  }
}

export class Segment {
  literal: string = ''
  regexp: RegExp | undefined
  globstar: boolean = false

  constructor(segment: string) {
    // Check globstar
    if (segment === '**') {
      this.globstar = true
      return
    }

    // Windows
    if (IS_WINDOWS) {
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
    const options: minimatch.IOptions = {
      dot: true,
      nobrace: true,
      nocase,
      nocomment: true,
      noext: true,
      nonegate: true,
      noglobstar: true
    }
    const minimatchObj = new minimatch.Minimatch(segment, options)
    assert(
      minimatchObj.set.length === 1 && minimatchObj.set[0].length === 1,
      `Unexpected expression from pattern segment '${segment}'`
    )
    return minimatchObj.set[0][0]
  }
}
