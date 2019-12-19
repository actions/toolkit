import * as assert from 'assert'
import * as path from 'path'

const IS_WINDOWS = process.platform === 'win32'

export class Path {
  segments: string[] = []

  constructor(rootedPath: string) {
    assert(rootedPath, `Parameter 'rootedPath' cannot be empty`)
    assert(isRooted(rootedPath), `Parameter 'rootedPath' must be rooted. Invalid path: '${rootedPath}'`)

    // Normalize slashes
    rootedPath = normalizeSeparators(rootedPath)

    // Trim trailing slash
    rootedPath = safeTrimTrailingSeparator(rootedPath)

    // Push all segments, while not at the root
    let remaining = rootedPath
    let dir = dirname(remaining)
    while (dir !== remaining) {
      // Push the segment
      const basename = path.basename(remaining)
      assert(basename !== '.', `Unexpected segment '.' in path '${rootedPath}'`)
      assert(basename !== '..', `Unexpected segment '..' in path '${rootedPath}'`)
      this.segments.push(basename)

      // Truncate the last segment
      remaining = dir
      dir = dirname(remaining)
    }

    // Remainder is the root
    // On Windows, convert any slashes in the root to '/'
    this.segments.push(IS_WINDOWS ? remaining.replace(/\\/g, '/') : remaining)
  }
}

/**
 * Roots the path if not already rooted
 */
export function ensureRooted(root: string, p: string): string {
  assert(root, `ensureRooted parameter 'root' cannot be empty`)
  assert(p, `ensureRooted parameter 'p' cannot be empty`)

  // Already rooted
  if (isRooted(p)) {
    return p
  }

  // On Windows, check for root like C:
  if (IS_WINDOWS && root.match(/^[A-Z]:$/i)) {
    return root + p
  }

  // Otherwise ensure root ends with a separator
  if (root.endsWith('/') || (IS_WINDOWS && root.endsWith('\\'))) {
    // Intentionally empty
  } else {
    // Append separator
    root += path.sep
  }

  return root + p
}

/**
 * Normalizes the path and trims the trailing separator (when safe).
 * For example, '/foo/' => '/foo' but '/' => '/'
 */
export function safeTrimTrailingSeparator(p: string): string {
  // Short-circuit if empty
  if (!p) {
    return ''
  }

  // Normalize separators
  p = normalizeSeparators(p)

  // No trailing slash
  if (!p.endsWith(path.sep)) {
    return p
  }

  // Check '/' on macOS/Linux and '\' on Windows
  if (p === path.sep) {
    return p
  }

  // On Windows check if drive root. E.g. C:\
  if (IS_WINDOWS && /^[A-Z]:\\$/i.test(p)) {
    return p
  }

  // Otherwise trim trailing slash
  return p.substr(0, p.length - 1)
}

/**
 * Similar to path.dirname except normalizes the path separators and slightly better handling for Windows UNC paths.
 *
 * For example, on macOS/Linux:
 *   /               => /
 *   /hello          => /
 *
 * For example, on Windows:
 *   C:\             => C:\
 *   C:\hello        => C:\
 *   C:              => C:
 *   C:hello         => C:
 *   \               => \
 *   \hello          => \
 *   \\hello         => \\hello
 *   \\hello\world   => \\hello\world
 */
export function dirname(p: string): string {
  // Normalize separators
  // Trim unnecessary trailing slash
  p = normalizeSeparators(p)
  p = safeTrimTrailingSeparator(p)

  // Windows UNC root, e.g. \\hello or \\hello\world
  if (IS_WINDOWS && /^\\\\[^\\]+(\\[^\\]+)?$/.test(p)) {
    return p
  }

  // Get dirname
  let result = path.dirname(p)

  // Trim trailing slash for Windows UNC root, e.g. \\hello\world\
  if (IS_WINDOWS && /^\\\\[^\\]+\\[^\\]+\\$/.test(result)) {
    result = safeTrimTrailingSeparator(result)
  }

  return result
}

/**
 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
 */
export function isRooted(p: string): boolean {
  assert(p, `isRooted parameter 'p' cannot be empty`)

  // Normalize separators
  p = normalizeSeparators(p)

  // Windows
  if (IS_WINDOWS) {
    // E.g. \ or \hello or \\hello
    // E.g. C: or C:\hello
    return (
      p.startsWith('\\') || /^[A-Z]:/i.test(p)
    )
  }

  // E.g. /hello
  return p.startsWith('/')
}

/**
 * Removes redundant slashes and converts '/' to '\' on Windows
 */
export function normalizeSeparators(p: string): string {
  p = p || ''

  // Windows
  if (IS_WINDOWS) {
    // Convert slashes on Windows
    p = p.replace(/\//g, '\\')

    // Remove redundant slashes
    const isUnc = /^\\\\+[^\\]/.test(p) // e.g. \\hello
    return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\') // preserve leading \\ for UNC
  }

  // Remove redundant slashes
  return p.replace(/\/\/+/g, '/')
}
