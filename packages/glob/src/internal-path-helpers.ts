import * as path from 'path'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Roots the path if not already rooted
 */
export function ensureRooted(root: string, p: string): string {
  if (!root) {
    throw new Error('ensureRooted() parameter "root" cannot be empty')
  }

  if (!p) {
    throw new Error('ensureRooted() parameter "p" cannot be empty')
  }

  if (isRooted(p)) {
    return p
  }

  // Check for root like C: on Windows
  if (IS_WINDOWS && root.match(/^[A-Z]:$/i)) {
    return root + p
  }

  // ensure root ends with a separator
  if (root.endsWith('/') || (IS_WINDOWS && root.endsWith('\\'))) {
    // root already ends with a separator
  } else {
    root += path.sep // append separator
  }

  return root + p
}

/**
 * Normalizes the path and trims the trailing separator (when safe).
 * For example, '/foo/' => '/foo' but '/' => '/'
 */
export function safeTrimTrailingPathSeparator(p: string): string {
  // Short-circuit if empty
  if (!p) {
    return ''
  }

  // Normalize separators
  p = normalizeSeparators(p)

  // Check if ends with slash
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
  p = normalizeSeparators(p)

  // Trim unnecessary trailing slash
  p = safeTrimTrailingPathSeparator(p)

  // Windows UNC root, e.g. \\hello or \\hello\world
  if (IS_WINDOWS && /^\\\\[^\\]+(\\[^\\]+)?$/.test(p)) {
    return p
  }

  return path.dirname(p)
}

/**
 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
 */
export function isRooted(p: string): boolean {
  p = normalizeSeparators(p)
  if (!p) {
    throw new Error("isRooted() parameter 'p' cannot be empty")
  }

  if (IS_WINDOWS) {
    return (
      p.startsWith('\\') || /^[A-Z]:/i.test(p) // e.g. \ or \hello or \\hello
    ) // e.g. C: or C:\hello
  }

  return p.startsWith('/') // e.g. /hello
}

/**
 * Removes redundant slashes and converts '/' to '\' on Windows
 */
export function normalizeSeparators(p: string): string {
  p = p || ''
  if (IS_WINDOWS) {
    // convert slashes on Windows
    p = p.replace(/\//g, '\\')

    // remove redundant slashes
    const isUnc = /^\\\\+[^\\]/.test(p) // e.g. \\hello
    return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\') // preserve leading // for UNC
  }

  // remove redundant slashes
  return p.replace(/\/\/+/g, '/')
}
