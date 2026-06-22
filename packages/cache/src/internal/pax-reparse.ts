/**
 * Length-correct PAX extended-header re-parser.
 *
 * node-tar v7 parses PAX extended-header bodies with a naive `split('\n')`
 * (see `pax.js`'s `parseKV`, whose own source carries an `XXX Values with \n
 * in them will fail this` comment). A PAX record is actually a length-prefixed
 * sequence:
 *
 *     "<decimal-length> <key>=<value>\n"
 *
 * where `<decimal-length>` is the total byte length of the record including
 * the digits, the space, the `=`, the value, and the trailing `\n`. Values may
 * legally contain `\n`. GNU tar and libarchive (bsdtar / Windows `tar.exe`)
 * both parse by consuming exactly `<decimal-length>` bytes, so a value
 * containing an embedded `"\n<len> path=<other>\n"` desynchronises node-tar
 * from every real extractor — a path / linkpath parser-differential bypass.
 *
 * This module re-parses each captured PAX body the way every real extractor
 * does (length-prefixed, byte-accurate) and cross-checks the result against
 * node-tar's view of the entry. Any disagreement on `path` or `linkpath` is a
 * `PAX_DESYNC` violation; a body node-tar treated as PAX that this parser
 * cannot fully account for is a `PAX_PARSE_FAIL`; and any PAX key not on the
 * known allow-list is a `PAX_UNKNOWN_KEY` (fail-closed against future
 * placement-affecting extensions).
 *
 * Everything here is pure (no I/O, no node-tar dependency) so it can be unit
 * tested in isolation.
 */

/** Machine-readable reason codes produced by the PAX cross-check. */
export type PaxReparseCode =
  | 'PAX_DESYNC'
  | 'PAX_PARSE_FAIL'
  | 'PAX_UNKNOWN_KEY'
  | 'PAX_UNSUPPORTED_KEY'

/** A single disagreement surfaced by {@link crossCheckMetaBodies}. */
export interface PaxReparseViolation {
  code: PaxReparseCode
  reason: string
}

/**
 * PAX keys that are known-legitimate and do not influence where extracted
 * bytes land (or, for `path` / `linkpath`, are explicitly cross-checked).
 * Anything outside this set — and the prefix set below — is rejected so a
 * future placement-affecting PAX extension cannot silently slip past the
 * validator.
 *
 * Sourced from POSIX.1-2017 §3.4.3 plus the GNU tar (`xheader.c`) and
 * libarchive (`archive_read_format_tar.c`) extension vocabularies.
 */
export const PAX_KNOWN_KEYS: ReadonlySet<string> = new Set([
  // POSIX.1-2017 §3.4.3
  'atime',
  'ctime',
  'mtime',
  'charset',
  'comment',
  'gid',
  'gname',
  'hdrcharset',
  'linkpath',
  'path',
  'size',
  'uid',
  'uname',
  // SCHILY / star vocabulary that node-tar itself emits and consumes
  'dev',
  'ino',
  'nlink',
  'mode'
])

/**
 * Dotted-namespace PAX key prefixes that are known-legitimate. Matched as
 * prefixes so e.g. `SCHILY.xattr.user.foo`, `GNU.sparse.realsize`, and
 * `LIBARCHIVE.creationtime` are all accepted without enumerating every
 * possible suffix.
 */
export const PAX_KNOWN_PREFIXES: readonly string[] = [
  'SCHILY.',
  'GNU.',
  'LIBARCHIVE.',
  'POSIX.'
]

function isKnownPaxKey(key: string): boolean {
  if (PAX_KNOWN_KEYS.has(key)) return true
  return PAX_KNOWN_PREFIXES.some(prefix => key.startsWith(prefix))
}

/**
 * PAX key prefixes that system tar (GNU tar / libarchive) acts on to place or
 * reconstruct file content but that node-tar v7 does NOT process. node-tar
 * surfaces such an entry under its header `path`, while system tar would write
 * it elsewhere — GNU sparse files are reconstructed at `GNU.sparse.name`, which
 * an attacker can point outside the cache roots. That is a listing-vs-extraction
 * parser differential the `path` / `linkpath` cross-check cannot see (the key is
 * neither `path` nor `linkpath`). A cache archive never legitimately contains
 * sparse members, so any key in this namespace is rejected outright. This is
 * checked before {@link isKnownPaxKey} so it takes precedence over the broad
 * `GNU.` allow-list prefix.
 */
const PAX_REJECTED_PREFIXES: readonly string[] = ['GNU.sparse.']

function isRejectedPaxKey(key: string): boolean {
  return PAX_REJECTED_PREFIXES.some(prefix => key.startsWith(prefix))
}

/** Result of a length-correct parse of a single PAX extended-header body. */
export interface PaxParseResult {
  /** Decoded records, last-write-wins per key (POSIX-correct). Values kept as
   * raw bytes so non-ASCII / high-bit data is preserved until comparison. */
  records: Record<string, Buffer>
  /** True iff every byte of the body was accounted for by length-prefixed
   * records. False signals a body this parser could not fully account for. */
  ok: boolean
}

const DIGIT_0 = 0x30
const DIGIT_9 = 0x39
const SPACE = 0x20
const EQUALS = 0x3d
const LF = 0x0a

/**
 * Parse a PAX extended-header body using strict, byte-accurate,
 * length-prefixed records — the same algorithm GNU tar and libarchive use.
 *
 * Returns `{ok: false}` (with whatever records were parsed up to the failure)
 * the moment a record is not fully length-accountable: a non-digit length, a
 * length that overruns the buffer, a missing trailing `\n`, or a record with
 * no `=`.
 */
export function parsePaxLengthCorrect(buf: Buffer): PaxParseResult {
  const records: Record<string, Buffer> = {}
  let i = 0
  while (i < buf.length) {
    // <decimal-length> — a run of ASCII digits terminated by a single space.
    let j = i
    while (j < buf.length && buf[j] >= DIGIT_0 && buf[j] <= DIGIT_9) j++
    if (j === i || j >= buf.length || buf[j] !== SPACE) {
      return {records, ok: false}
    }
    const len = parseInt(buf.subarray(i, j).toString('ascii'), 10)
    // Length must be positive and the whole record must fit in the buffer.
    if (!Number.isFinite(len) || len <= 0 || i + len > buf.length) {
      return {records, ok: false}
    }
    // The record must end with a newline at exactly the length boundary.
    if (buf[i + len - 1] !== LF) {
      return {records, ok: false}
    }
    // "<digits> <key>=<value>\n" — the first '=' after the space separates
    // key from value. The value runs to just before the trailing newline and
    // may itself contain '=' and '\n'.
    const eq = buf.indexOf(EQUALS, j + 1)
    if (eq < 0 || eq >= i + len - 1) {
      return {records, ok: false}
    }
    const key = buf.subarray(j + 1, eq).toString('utf8')
    const value = buf.subarray(eq + 1, i + len - 1) // raw bytes, no trailing LF
    records[key] = value // last write wins
    i += len
  }
  return {records, ok: i === buf.length}
}

/**
 * Normalise a path for cross-parser comparison: collapse `\` to `/` (matching
 * node-tar's `normalizeWindowsPath` on Windows; a no-op for typical POSIX
 * paths) and drop a single trailing `/` so directory entries compare equal
 * regardless of how each side renders them. Pure string manipulation.
 */
function normalizeForCompare(p: string): string {
  let s = p.replace(/\\/g, '/')
  if (s.length > 1 && s.endsWith('/')) {
    s = s.slice(0, -1)
  }
  return s
}

function nulTrim(buf: Buffer): Buffer {
  const nul = buf.indexOf(0)
  return nul === -1 ? buf : buf.subarray(0, nul)
}

/**
 * Cross-check the captured extended-header (meta) bodies that preceded a
 * concrete entry against node-tar's resolved view of that entry.
 *
 * `metaBodies` are the raw bodies of every `ExtendedHeader` /
 * `GlobalExtendedHeader` / GNU `LongName` / `LongLink` meta entry emitted
 * since the previous concrete entry, in order. `entryPath` / `entryLinkpath`
 * are node-tar's final (post-PAX, post-long-name) values for the entry.
 *
 * The check is sound without ever invoking the system `tar`: this re-parser
 * computes the same `path` / `linkpath` every real extractor would, so a
 * disagreement with node-tar's value is exactly the signal that node-tar
 * mis-parsed the header.
 */
export function crossCheckMetaBodies(
  metaBodies: Buffer[],
  entryPath: string,
  entryLinkpath: string | undefined
): PaxReparseViolation[] {
  const violations: PaxReparseViolation[] = []
  let sawPax = false
  // Merged length-correct view of path / linkpath across all PAX bodies
  // (last write wins), matching POSIX precedence.
  let lcPath: Buffer | undefined
  let lcLinkpath: Buffer | undefined

  for (const body of metaBodies) {
    if (body.length === 0) continue
    const parsed = parsePaxLengthCorrect(body)
    const keys = Object.keys(parsed.records)

    if (parsed.ok && keys.length > 0) {
      // A well-formed PAX extended header.
      sawPax = true
      for (const key of keys) {
        if (isRejectedPaxKey(key)) {
          violations.push({
            code: 'PAX_UNSUPPORTED_KEY',
            reason: `unsupported placement-affecting PAX key '${key}' in extended header (node-tar ignores it; system tar would act on it)`
          })
        } else if (!isKnownPaxKey(key)) {
          violations.push({
            code: 'PAX_UNKNOWN_KEY',
            reason: `unknown PAX key '${key}' in extended header`
          })
        }
      }
      if (parsed.records['path'] !== undefined) {
        lcPath = parsed.records['path']
      }
      if (parsed.records['linkpath'] !== undefined) {
        lcLinkpath = parsed.records['linkpath']
      }
    } else {
      // Not a length-accountable PAX body. This is either a GNU `LongName` /
      // `LongLink` body (raw NUL-terminated path, no length prefix) or a
      // malformed PAX header crafted to desync node-tar. A legitimate GNU
      // long-name body's NUL-trimmed bytes must equal exactly the path or
      // linkpath node-tar resolved for the entry; anything else is a parser
      // disagreement we refuse to extract.
      const raw = nulTrim(body).toString('utf8')
      const rawCmp = normalizeForCompare(raw)
      const matchesPath = rawCmp === normalizeForCompare(entryPath)
      const matchesLink =
        entryLinkpath !== undefined &&
        rawCmp === normalizeForCompare(entryLinkpath)
      if (!matchesPath && !matchesLink) {
        violations.push({
          code: 'PAX_PARSE_FAIL',
          reason:
            'extended header body is not length-accountable and does not ' +
            "match the entry's resolved path or linkpath"
        })
      }
    }
  }

  if (sawPax) {
    if (lcPath !== undefined) {
      const lc = normalizeForCompare(lcPath.toString('utf8'))
      if (lc !== normalizeForCompare(entryPath)) {
        violations.push({
          code: 'PAX_DESYNC',
          reason: `PAX path disagreement: node-tar resolved ${JSON.stringify(
            entryPath
          )} but length-correct parse yields ${JSON.stringify(
            lcPath.toString('utf8')
          )}`
        })
      }
    }
    if (lcLinkpath !== undefined) {
      const lc = normalizeForCompare(lcLinkpath.toString('utf8'))
      const ntLink = entryLinkpath ?? ''
      if (lc !== normalizeForCompare(ntLink)) {
        violations.push({
          code: 'PAX_DESYNC',
          reason: `PAX linkpath disagreement: node-tar resolved ${JSON.stringify(
            entryLinkpath
          )} but length-correct parse yields ${JSON.stringify(
            lcLinkpath.toString('utf8')
          )}`
        })
      }
    }
  }

  return violations
}
