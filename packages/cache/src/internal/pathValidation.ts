import * as os from 'os'
import * as path from 'path'

/**
 * The validation mode controlling how off-root archive entries are handled
 * during cache restore.
 */
export type PathValidationMode = 'off' | 'warn' | 'error'

/**
 * Describes a single archive entry that fails validation.
 */
export interface PathValidationViolation {
  /** Path of the offending archive entry, as reported by the tar parser. */
  path: string
  /** Link target for symlink/hardlink entries (undefined for regular files). */
  linkpath?: string
  /** Resolved absolute path that triggered the violation. */
  resolved: string
  /** Tar entry type (File, Directory, SymbolicLink, Link, etc.). */
  entryType: string
  /** Machine-readable reason code. */
  code:
    | 'ABSOLUTE_PATH'
    | 'UNC_PATH'
    | 'NUL_BYTE'
    | 'OUTSIDE_ROOTS'
    | 'LINK_OUTSIDE_ROOTS'
    | 'UNSUPPORTED_TYPE'
  /** Human-readable description of the violation. */
  reason: string
}

/**
 * Result of validating a single archive entry.
 */
export type ValidationResult =
  | {ok: true}
  | {
      ok: false
      code: PathValidationViolation['code']
      resolved: string
      reason: string
    }

/**
 * Pre-computed form of an allowed-roots list, suitable for repeated
 * containment checks against many archive entries. Produced by
 * {@link prepareAllowedRoots}.
 *
 * Holds the case-sensitivity flag and per-root normalized + comparison
 * strings, so {@link validateEntry} can normalize each child path once and
 * compare against pre-baked strings instead of re-normalizing/lower-casing
 * the parent on every entry.
 */
export interface PreparedAllowedRoots {
  readonly caseInsensitive: boolean
  readonly roots: ReadonlyArray<PreparedRoot>
}

interface PreparedRoot {
  /** Normalized parent path, kept verbatim for diagnostics. */
  readonly normParent: string
  /** Normalized parent in comparison form (lowercased iff case-insensitive). */
  readonly normParentCmp: string
  /** Normalized parent with trailing separator, in comparison form. */
  readonly parentWithSepCmp: string
}

/**
 * Tar entry types that produce a real file/directory/link on disk and are
 * considered safe to extract from a cache archive. Anything outside this set
 * (other than header-only metadata entries below) is rejected by the
 * validator.
 *
 * This is intentionally an allow-list rather than a block-list: the cache
 * format only ever needs files, directories, and links, and a paranoid
 * security check should reject unknown entry types by default rather than
 * silently passing through anything node-tar happens to surface from a
 * non-standard typeflag byte.
 */
const ALLOWED_ENTRY_TYPES = new Set([
  'File',
  'OldFile', // legacy ustar regular-file typeflag
  'Directory',
  'SymbolicLink',
  'Link' // hardlink — common in node_modules caches via npm
])

/**
 * Tar entry types that describe metadata, not actual file content. These are
 * absorbed by the parser into the next real entry and do not produce a file on
 * disk, so we skip path validation for them.
 */
const HEADER_ONLY_ENTRY_TYPES = new Set([
  'NextFileHasLongPath',
  'NextFileHasLongLinkpath',
  'GlobalExtendedHeader',
  'ExtendedHeader',
  'OldGnuLongPath',
  'OldGnuLongLink'
])

/**
 * Characters that signal a glob portion of a declared cache path. Anything to
 * the right of the first segment containing one of these is stripped when
 * deriving the longest non-glob prefix.
 */
const GLOB_CHAR_REGEX = /[*?[\]{}!]/

/**
 * Returns the working directory used for cache extraction. Mirrors the value
 * used by `tar.ts` so validation matches the actual extraction CWD.
 */
export function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
}

/**
 * Derive the set of allowed extraction roots from the user-declared cache
 * `paths` input.
 *
 * For each declared path:
 * - The longest leading prefix that contains no glob metacharacters is taken.
 * - `~` and `~/...` are expanded to the user's home directory.
 * - `$VAR`, `${VAR}` (POSIX) and `%VAR%` (Windows) environment references
 *   are expanded.
 * - Patterns starting with `!` (glob negation) are dropped — negations narrow
 *   what gets cached, not what extraction is allowed to write.
 * - The result is resolved to an absolute path against `extractCwd` (or
 *   `getWorkingDirectory()` if not provided).
 *
 * The final list is deduplicated and parents subsume their children — if
 * `/a` is allowed, `/a/b` is dropped from the list.
 *
 * No filesystem canonicalization (`realpath`) is performed: we honor what
 * the user wrote literally. This preserves the user's intent if they
 * deliberately included a directory that happens to be a symlink.
 */
export function deriveAllowedRoots(
  declaredPaths: string[],
  extractCwd: string = getWorkingDirectory()
): string[] {
  const roots: string[] = []
  for (const raw of declaredPaths) {
    if (raw === undefined || raw === null) continue
    const trimmed = raw.trim()
    if (trimmed === '') continue
    if (trimmed.startsWith('!')) continue
    const root = deriveRoot(trimmed, extractCwd)
    if (root !== undefined) roots.push(root)
  }
  return collapseRoots(roots)
}

function deriveRoot(declaredPath: string, extractCwd: string): string {
  // Tilde expansion is structural (only valid at the very start) and cannot
  // introduce glob characters, so apply it up-front.
  let raw = declaredPath
  if (raw === '~') {
    raw = os.homedir()
  } else if (raw.startsWith('~/') || raw.startsWith('~\\')) {
    raw = path.join(os.homedir(), raw.slice(2))
  }

  // Identify the longest leading run of segments that contain no glob
  // metacharacters BEFORE expanding env-var references. Doing so handles
  // two distinct concerns:
  //   1. `${VAR}` reference syntax contains `{` and `}`, which would
  //      otherwise match the brace-glob class and discard the entire
  //      reference from the prefix.
  //   2. If an env value happens to contain a glob character (rare, but
  //      possible on attacker-influenced env), expanding before checking
  //      would shorten the prefix mid-path and silently broaden the
  //      allowed root. By checking the raw text and only expanding the
  //      kept prefix afterwards, env-derived characters are preserved
  //      verbatim in the resulting root rather than truncating it.
  // Split on either separator so glob detection works for both styles;
  // a leading empty segment from absolute POSIX paths (e.g. "/a/b" →
  // ["", "a", "b"]) is preserved so the rejoin below produces "/a/b".
  const segments = raw.split(/[\\/]/)
  const nonGlobSegments: string[] = []
  for (const seg of segments) {
    if (segmentHasGlob(seg)) break
    nonGlobSegments.push(seg)
  }

  // Expand env vars only on the kept prefix.
  const prefix = expandEnvVars(nonGlobSegments.join('/'))

  // If the pattern starts with a glob metachar (e.g. "**/foo"), the prefix
  // is empty — fall back to the extraction CWD.
  if (prefix === '' || prefix === '.') {
    return path.resolve(extractCwd)
  }

  // Resolve relative to the extraction CWD; this produces an absolute path.
  return path.resolve(extractCwd, prefix)
}

/**
 * True if `seg` contains a glob metacharacter that isn't part of an
 * env-var reference. Strips `${VAR}`, `$VAR`, and `%VAR%` first so the
 * curly braces in `${VAR}` aren't misread as a brace-glob.
 */
function segmentHasGlob(seg: string): boolean {
  const stripped = seg
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, '')
    .replace(/%[^%]+%/g, '')
  return GLOB_CHAR_REGEX.test(stripped)
}

function expandEnvVars(input: string): string {
  let result = input
  // ${VAR}
  result = result.replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] ?? '')
  // $VAR (POSIX-style identifier)
  result = result.replace(
    /\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (_, name) => process.env[name] ?? ''
  )
  // %VAR% (Windows-style)
  result = result.replace(/%([^%]+)%/g, (_, name) => process.env[name] ?? '')
  return result
}

/**
 * Deduplicate roots and drop any root that is contained within another root
 * already in the set. Comparison is segment-aware so `/aa` is NOT considered
 * a child of `/a`.
 */
function collapseRoots(roots: string[]): string[] {
  const normalized: string[] = []
  for (const r of roots) {
    const n = path.normalize(r)
    if (!normalized.some(existing => pathsEqual(existing, n))) {
      normalized.push(n)
    }
  }
  // Sort so shorter (potentially-parent) paths come first.
  normalized.sort((a, b) => a.length - b.length)
  const result: string[] = []
  for (const candidate of normalized) {
    if (!result.some(parent => isUnderRoot(candidate, parent))) {
      result.push(candidate)
    }
  }
  return result
}

/**
 * Validate a single archive entry against the allowed roots.
 *
 * For symlinks/hardlinks the link target is also validated:
 * - For symlinks, the target is resolved relative to the entry's directory
 *   (matching POSIX symlink semantics).
 * - For hardlinks, the target is resolved relative to the extraction CWD
 *   (matching tar's hardlink-target semantics).
 *
 * The validator never touches the filesystem; it operates purely on path
 * strings. Allowed roots are not realpath'd — the caller is expected to
 * derive them via {@link deriveAllowedRoots} which honors the user's
 * declared paths literally.
 */
export function validateEntry(
  entryPath: string,
  linkPath: string | undefined,
  entryType: string,
  allowedRoots: string[] | PreparedAllowedRoots,
  extractCwd: string = getWorkingDirectory()
): ValidationResult {
  // Accept either a raw string[] (kept for callers / unit tests) or a
  // pre-computed PreparedAllowedRoots produced by prepareAllowedRoots. The
  // hot path (listAndValidate) always passes the prepared form.
  const prepared = Array.isArray(allowedRoots)
    ? prepareAllowedRoots(allowedRoots)
    : allowedRoots
  // Skip header-only entries — they describe the next real entry.
  if (HEADER_ONLY_ENTRY_TYPES.has(entryType)) {
    return {ok: true}
  }

  // Compute the resolved entry path up-front so every failure branch can
  // report it. `path.resolve` is pure string manipulation and is safe to
  // call even for inputs that we will subsequently reject (NUL bytes,
  // UNC paths, absolute paths). For absolute inputs the cwd component is
  // discarded by path.resolve, which is the behavior we want — the
  // reported `resolved` is the absolute location the entry would write to.
  const resolvedEntry = resolveEntry(entryPath, extractCwd)

  // Reject anything that is not on the allow-list of known-safe entry types.
  // This rejects device/FIFO/sparse entries, and also rejects any future or
  // attacker-supplied typeflag byte that node-tar surfaces as an unknown
  // string (since a cache archive should never legitimately contain one).
  if (!ALLOWED_ENTRY_TYPES.has(entryType)) {
    return {
      ok: false,
      code: 'UNSUPPORTED_TYPE',
      resolved: resolvedEntry,
      reason: `unsupported tar entry type: ${entryType}`
    }
  }

  // Reject NUL bytes anywhere in the path.
  if (entryPath.includes('\0')) {
    return {
      ok: false,
      code: 'NUL_BYTE',
      resolved: resolvedEntry,
      reason: 'NUL byte in entry path'
    }
  }

  // Reject UNC paths. Check the original string before separator normalization
  // because UNC is identified by leading `\\` or `//`.
  if (
    entryPath.startsWith('\\\\') ||
    entryPath.startsWith('//') ||
    /^[\\/]{2}\?[\\/]/.test(entryPath)
  ) {
    return {
      ok: false,
      code: 'UNC_PATH',
      resolved: resolvedEntry,
      reason: `UNC path not allowed: ${entryPath}`
    }
  }

  // Reject Windows-style absolute paths and drive-relative paths (`C:foo`).
  // These can be present in archives created on Windows even when extracted
  // on POSIX, so we reject them on every platform.
  if (/^[a-zA-Z]:/.test(entryPath)) {
    return {
      ok: false,
      code: 'ABSOLUTE_PATH',
      resolved: resolvedEntry,
      reason: `absolute or drive-relative path not allowed: ${entryPath}`
    }
  }

  // Reject POSIX absolute paths.
  if (entryPath.startsWith('/') || entryPath.startsWith('\\')) {
    return {
      ok: false,
      code: 'ABSOLUTE_PATH',
      resolved: resolvedEntry,
      reason: `absolute path not allowed: ${entryPath}`
    }
  }

  if (!isUnderAnyPreparedRoot(resolvedEntry, prepared)) {
    return {
      ok: false,
      code: 'OUTSIDE_ROOTS',
      resolved: resolvedEntry,
      reason: `path resolves outside allowed roots: ${entryPath} -> ${resolvedEntry}`
    }
  }

  // Validate link targets for symlinks and hardlinks.
  if (
    linkPath !== undefined &&
    linkPath !== '' &&
    (entryType === 'SymbolicLink' || entryType === 'Link')
  ) {
    let resolvedLink: string
    if (entryType === 'SymbolicLink') {
      // Symlink targets are resolved relative to the link's containing
      // directory at extraction time. We mirror that here so a symlink
      // pointing outside the allowed roots is rejected.
      resolvedLink = path.resolve(path.dirname(resolvedEntry), linkPath)
    } else {
      // Hardlink targets are resolved relative to the extraction CWD.
      resolvedLink = path.resolve(extractCwd, linkPath)
    }
    if (linkPath.includes('\0')) {
      return {
        ok: false,
        code: 'NUL_BYTE',
        resolved: resolvedLink,
        reason: 'NUL byte in link target'
      }
    }
    if (!isUnderAnyPreparedRoot(resolvedLink, prepared)) {
      return {
        ok: false,
        code: 'LINK_OUTSIDE_ROOTS',
        resolved: resolvedLink,
        reason: `link target resolves outside allowed roots: ${linkPath} -> ${resolvedLink}`
      }
    }
  }

  return {ok: true}
}

function resolveEntry(entryPath: string, extractCwd: string): string {
  // Tar paths are POSIX-style. Convert to native separators so path.resolve
  // produces the right thing on Windows.
  const native = entryPath.split(/[\\/]/).join(path.sep)
  return path.resolve(extractCwd, native)
}

function isUnderAnyRoot(resolved: string, roots: string[]): boolean {
  for (const root of roots) {
    if (isUnderRoot(resolved, root)) return true
  }
  return false
}

/**
 * Precompute a {@link PreparedAllowedRoots} from a raw roots array. Call
 * once per `listAndValidate` invocation and reuse for every entry.
 *
 * Pulling these constants out of the inner loop is the difference between
 * O(entries × roots) `path.normalize`/`toLowerCase` calls and O(entries +
 * roots) calls — for large caches the per-entry validation reduces to a
 * single normalize + (optional) lowercase plus N pre-baked string compares.
 */
export function prepareAllowedRoots(roots: string[]): PreparedAllowedRoots {
  const caseInsensitive = caseInsensitiveFs()
  const prepared: PreparedRoot[] = roots.map(root => {
    const normParent = path.normalize(root)
    const parentWithSep = normParent.endsWith(path.sep)
      ? normParent
      : normParent + path.sep
    return {
      normParent,
      normParentCmp: caseInsensitive ? normParent.toLowerCase() : normParent,
      parentWithSepCmp: caseInsensitive
        ? parentWithSep.toLowerCase()
        : parentWithSep
    }
  })
  return {caseInsensitive, roots: prepared}
}

function isUnderAnyPreparedRoot(
  resolved: string,
  prepared: PreparedAllowedRoots
): boolean {
  const normChild = path.normalize(resolved)
  const childCmp = prepared.caseInsensitive
    ? normChild.toLowerCase()
    : normChild
  for (const root of prepared.roots) {
    if (childCmp === root.normParentCmp) return true
    if (childCmp.startsWith(root.parentWithSepCmp)) return true
  }
  return false
}

function isUnderRoot(child: string, parent: string): boolean {
  const normChild = path.normalize(child)
  const normParent = path.normalize(parent)
  if (pathsEqual(normChild, normParent)) return true
  const parentWithSep = normParent.endsWith(path.sep)
    ? normParent
    : normParent + path.sep
  if (caseInsensitiveFs()) {
    return normChild.toLowerCase().startsWith(parentWithSep.toLowerCase())
  }
  return normChild.startsWith(parentWithSep)
}

function pathsEqual(a: string, b: string): boolean {
  return caseInsensitiveFs() ? a.toLowerCase() === b.toLowerCase() : a === b
}

/**
 * Conservative platform-level guess at filesystem case-sensitivity. Used by
 * {@link isUnderRoot} and {@link pathsEqual} when comparing allowed roots
 * against resolved entry paths.
 *
 * - Windows: NTFS is case-insensitive by default (per-directory case
 *   sensitivity via `fsutil` is opt-in and rare).
 * - macOS: APFS and HFS+ default to case-insensitive; the case-sensitive
 *   APFS variant is selectable at format time but rarely used outside of
 *   developer setups.
 * - Other platforms (Linux/BSD/etc.) are assumed case-sensitive.
 *
 * On a case-sensitive volume mounted under a case-insensitive platform
 * (e.g. case-sensitive APFS on macOS) this guess errs toward treating the
 * fs as case-insensitive, which **loosens** the comparison: an entry like
 * `cache/Foo` could be considered to be under the allowed root
 * `/workspace/cache/foo` even though the underlying fs would create them
 * as distinct paths. The direction of the error is fewer violations
 * reported, not more, so this is a soundness loosening rather than a
 * security-relevant miss — the worst outcome is letting an entry through
 * that the actual extraction would then write to a different path than
 * the allowed root suggests.
 *
 * Probing the workspace with `fs.realpathSync.native` would be more
 * accurate but adds I/O on every restore and complicates the otherwise
 * pure path-string validator, so this platform-level heuristic is
 * preferred for now. Revisit if real-world reports show false negatives
 * on case-sensitive macOS/Windows volumes.
 */
function caseInsensitiveFs(): boolean {
  return process.platform === 'win32' || process.platform === 'darwin'
}

/**
 * Format a violation list for human consumption in a single warning message.
 * Truncates after `maxShown` entries and appends a count of the remainder so
 * the warning stays a reasonable size.
 */
export function formatViolationSummary(
  violations: PathValidationViolation[],
  maxShown = 5
): string {
  const total = violations.length
  if (total === 0) return ''
  const shown = violations.slice(0, maxShown)
  const lines = shown.map(v => `  - ${v.reason}`)
  const remainder = total - shown.length
  if (remainder > 0) {
    lines.push(`  - ...and ${remainder} more (see debug log for full list)`)
  }
  return lines.join('\n')
}
