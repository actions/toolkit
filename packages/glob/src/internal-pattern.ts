import * as assert from 'assert'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'
import {Minimatch, IMinimatch, IOptions as IMinimatchOptions} from 'minimatch'
import {Path} from './internal-path'

const IS_WINDOWS = process.platform === 'win32'

export enum MatchResult {
  /** Not matched */
  None = 0,

  /** Matched if the path is a directory */
  Directory = 1,

  /** Matched if the path is a regular file */
  File = 2,

  /** Matched */
  All = Directory | File,
}

export class Pattern {
  comment: boolean = false
  negate: boolean = false
  searchPath: string = ''
  // private segments: PatternSegment[] = []
  private minimatch: IMinimatch
  private rootRegExp: RegExp
  private trailingSlash: boolean = false

  constructor(pattern: string) {
    pattern = pattern || ''

    // Comment
    if (pattern.startsWith('#')) {
      this.comment = true
      this.minimatch = undefined as unknown as IMinimatch
      this.rootRegExp = undefined as unknown as RegExp
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
    const rootSegment = (new Path(pattern)).segments[0]
    this.rootRegExp = new RegExp(this.regExpEscape(rootSegment), IS_WINDOWS ? 'i' : '')

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

    // // Create pattern segments
    // const parsedPath = new Path(pattern)
    // let isPrevGlobstar = false
    // for (const segment of parsedPath.segments.map(x => new PatternSegment(x))) {
    //   if (segment.globstar && isPrevGlobstar) {
    //     // Collapse consecutive globstar
    //     continue
    //   }
    //   this.segments.push(segment)
    //   isPrevGlobstar = segment.globstar
    // }

    // // Create one large regexp
    // let regexpPattern = '^'
    // const unhandledUncRoot = IS_WINDOWS && this.segments[0].literal.startsWith('//')
    // for (let i = 0; i < this.segments.length; i++) {
    //   const segment = this.segments[i]

    //   // Globstar
    //   if (segment.globstar) {
    //     if (unhandledUncRoot) {
    //       regexpPattern += '(?:/[^/]+(?:/[^/]+)*)?'
    //     }
    //     else {
    //       regexpPattern += '(?:[^/]+(?:/[^/]+)*)?'
    //     }
    //     continue
    //   }
    //   // Root
    //   else if (i === 0) {
    //     regexpPattern += 
    //   }
    //   // Only add separater The root segment almost always ends with a slash
    //   else if (i > 0 && unhandledUncRoot) {
    //   }


    //   // Append a slash after a root Windows UNC path (e.g. //hello/world). Otherwise
    //   // all other root segments end with a trailing slash or should not have one appended.
    //   if (
    //     i == 1 &&
    //     IS_WINDOWS &&
    //     !this.segments[0].literal.endsWith('/') &&
    //     !this.segments[0].literal.startsWith('//')
    //   ) {
    //     // regexpPattern += // what if segments[1].globstar ?
    //   }
    //   // // Append a
    //   // else if (i >= 2) {
    //   // }
    //   // if (segment.globstar) {
    //   //   regexpPattern += '(?:.+/)?'
    //   // }
    //   // else if (segment.literal) {
    //   // }
    // }
    // regexpPattern += '$'
    // const flags = IS_WINDOWS ? 'i' : ''
    // this.regexp = new RegExp(regexpPattern, flags)

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

  match(itemPath: string): MatchResult {
    if (this.comment) {
      return MatchResult.None
    }

    if (this.minimatch?.match(itemPath)) {
      return this.trailingSlash ? MatchResult.Directory : MatchResult.All
    }

    return MatchResult.None
  }

  partialMatch(itemPath: string): boolean {
    if (this.comment) {
      return false
    }

    // matchOne does not handle root path correctly
    if (pathHelper.dirname(itemPath) == itemPath) {
      return this.rootRegExp.test(itemPath)
    }

    return this.minimatch.matchOne(itemPath.split(/\/+/), this.minimatch.set[0], true)
  }

  private regExpEscape(s: string): string {
    return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
  }
}

// class PatternSegment {
//   literal: string = ''
//   regexp: RegExp | undefined
//   globstar: boolean = false

//   constructor(segment: string) {
//     // Globstar
//     if (segment === '**') {
//       this.globstar = true
//       return
//     }

//     // Root segment
//     if (segment.includes('/')) {
//       this.literal = segment
//     }
//     // Windows
//     else if (IS_WINDOWS) {
//       // Try case sensitive
//       let expression = this.getExpression(segment)
//       if (typeof expression === 'string') {
//         this.literal = expression
//       }

//       // Try case insensitive
//       expression = this.getExpression(segment, true)
//       if (typeof expression === 'object') {
//         this.regexp = expression
//       }
//     }
//     // Linux/macOS
//     else {
//       // Set literal or regex
//       const expression = this.getExpression(segment)
//       if (typeof expression === 'string') {
//         this.literal = expression
//       } else {
//         this.regexp = expression
//       }
//     }

//     // Always set regexp
//     if (!this.regexp) {
//       assert(
//         this.literal,
//         `Unexpected expression from pattern segment '${segment}'`
//       )
//       const pattern = `^${this.regExpEscape(this.literal)}$`
//       const flags = IS_WINDOWS ? 'i' : ''
//       this.regexp = new RegExp(pattern, flags)
//     }

//     // Validate at least one is set
//     assert(
//       this.literal || this.regexp,
//       `Unexpected expression from pattern segment '${segment}'`
//     )
//   }

//   private getExpression(
//     segment: string,
//     nocase: boolean = false
//   ): string | RegExp {
//     const options: MinimatchOptions = {
//       dot: true,
//       nobrace: true,
//       nocase,
//       nocomment: true,
//       noext: true,
//       nonegate: true
//     }
//     const minimatchObj = new Minimatch(segment, options)
//     assert(
//       minimatchObj.set.length === 1 && minimatchObj.set[0].length === 1,
//       `Unexpected expression from pattern segment '${segment}'`
//     )
//     return minimatchObj.set[0][0]
//   }

//   /**
//    * Escapes regexp special characters: `[ \ ^ $ . | ? * + ( )`
//    * For more information, refer to https://javascript.info/regexp-escaping
//    */
//   private regExpEscape(s: string): string {
//     return s.replace(/[[\\^$.|?*+()]/g, '\\$&')
//   }
// }


