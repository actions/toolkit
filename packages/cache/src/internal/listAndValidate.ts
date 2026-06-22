import {spawn} from 'child_process'
import {createReadStream} from 'fs'
import {Readable} from 'stream'
import {pipeline} from 'stream/promises'
import {Parser, ReadEntry} from 'tar'
import {CompressionMethod} from './constants.js'
import {
  PathValidationViolation,
  prepareAllowedRoots,
  validateEntry
} from './pathValidation.js'
import {crossCheckMetaBodies} from './pax-reparse.js'

/**
 * Result of streaming and validating a tar archive.
 */
export interface ListAndValidateResult {
  /** Entries that failed validation. Empty iff the archive is clean. */
  violations: PathValidationViolation[]
  /**
   * The `entry.path` of every entry that passed validation, in archive order.
   * Used to build the NUL-separated allow-list (`-T`) handed to system `tar`
   * so extraction is restricted to members the validator approved — by the
   * exact name node-tar derived from the same bytes. Only meaningful when
   * `violations` is empty (otherwise extraction is blocked or unrestricted).
   */
  approvedNames: string[]
}

/**
 * Upper bound on the size of a PAX / GNU extended-header body the validator is
 * willing to re-parse, passed to node-tar as `maxMetaEntrySize`. Real extended
 * headers are a few hundred bytes at most; anything larger is emitted as an
 * `ignoredEntry` (see the handler below) and recorded as a violation rather
 * than silently dropped — the oversized-extended-header defence.
 *
 * This deliberately matches node-tar's current 1 MiB default. Pinning it here
 * (rather than leaving the option unset) keeps the oversized-header threshold
 * under our control even if a future node-tar release changes its internal
 * default.
 */
const META_REJECT_BYTES = 1024 * 1024

/**
 * Maximum number of pending extended-header (meta) bodies to retain while
 * waiting for the concrete entry they apply to. A legitimate entry is
 * preceded by at most a handful of meta headers; an archive that streams an
 * unbounded run of meta headers with no concrete entry is malformed and must
 * not be allowed to grow memory without bound.
 */
const MAX_PENDING_META = 64

/**
 * Stream the entries of a (possibly compressed) tar archive and validate each
 * against the allowed roots. Does NOT extract any files — entries are read
 * for header inspection only. Returns the list of violations (empty if the
 * archive is clean) and the names approved for extraction.
 *
 * Throws an Error if the archive cannot be parsed (corrupt header,
 * decompression failure, truncated stream, etc.). The caller is responsible
 * for translating that into a CacheIntegrityError with code `PARSE_ERROR`.
 */
export async function listAndValidate(
  archivePath: string,
  compressionMethod: CompressionMethod,
  allowedRoots: string[],
  extractCwd: string
): Promise<ListAndValidateResult> {
  const violations: PathValidationViolation[] = []
  const approvedNames: string[] = []

  // Precompute the normalized / case-folded form of each allowed root once,
  // so the per-entry containment check is a handful of string compares
  // rather than an O(roots) re-normalization on every entry.
  const preparedRoots = prepareAllowedRoots(allowedRoots)

  // Captured parse error (if any). We don't throw synchronously from inside
  // the parser's onwarn callback because doing so leaves the parser's
  // internal stream in a half-broken state that hangs the surrounding
  // pipeline. Instead we record the first critical warning and throw it
  // after the pipeline completes.
  let firstParseError: Error | undefined

  const recordParseError = (code: string, message: string): void => {
    if (firstParseError) return
    firstParseError = new Error(`tar parse error (${code}): ${message}`)
  }

  // Raw bodies of the extended-header (meta) entries seen since the last
  // concrete entry. node-tar emits a `'meta'` event carrying the decoded
  // body string of each PAX / GNU long-name header *before* it emits the
  // concrete entry the header applies to. We re-parse these length-correctly
  // (see pax-reparse.ts) and cross-check against node-tar's resolved
  // path / linkpath to catch PAX newline differentials, where an embedded
  // newline in a PAX value makes node-tar resolve a different path than the
  // system tar that performs the extraction.
  let pendingMeta: Buffer[] = []

  const consumePendingMeta = (): Buffer[] => {
    const bodies = pendingMeta
    pendingMeta = []
    return bodies
  }

  // Record a single validation failure. Every call site shares the same shape
  // — path / linkpath / type come from the ReadEntry; only the code, reason and
  // resolved location vary — so funnel them through one helper.
  const addViolation = (
    entry: ReadEntry,
    code: PathValidationViolation['code'],
    reason: string,
    resolved: string
  ): void => {
    violations.push({
      path: entry.path,
      linkpath: entry.linkpath || undefined,
      resolved,
      entryType: entry.type,
      code,
      reason
    })
  }

  // For gzip we let node-tar handle decompression internally (its built-in
  // gzip support is mature). For zstd we spawn the system `zstd` binary so
  // we get the same `--long=30` window-size handling as the existing
  // extract codepath in tar.ts and avoid relying on Node's experimental
  // zstd support.
  const useNativeGzip = compressionMethod === CompressionMethod.Gzip
  const parser = new Parser({
    gzip: useNativeGzip,
    // Disable strict mode so recoverable warnings (e.g. unknown extended
    // headers) don't abort parsing. Real corruption is surfaced explicitly
    // via the captured error below.
    strict: false,
    // Cap extended-header bodies explicitly so an oversized PAX header is
    // turned into a recorded `ignoredEntry` violation and the oversized-header
    // threshold stays under our control (see META_REJECT_BYTES).
    maxMetaEntrySize: META_REJECT_BYTES,
    // Treat structural problems (bad archive, bad header, bad chksum) as
    // hard parse errors — silently ignoring them would let a corrupt
    // archive sail through validation. We DO NOT throw on softer warnings
    // (extended headers, unknown PAX keys, etc.).
    onwarn: (code, message) => {
      if (
        code === 'TAR_BAD_ARCHIVE' ||
        code === 'TAR_ENTRY_INVALID' ||
        code === 'TAR_ENTRY_ERROR' ||
        code === 'TAR_ABORT'
      ) {
        recordParseError(code, message)
      }
    },
    onReadEntry: (entry: ReadEntry) => {
      try {
        const metaBodies = consumePendingMeta()
        let approved = true

        // Cross-check any PAX / long-name headers that preceded this entry
        // against node-tar's resolved view. A disagreement means node-tar
        // mis-parsed the header relative to what GNU/BSD tar will extract.
        for (const pax of crossCheckMetaBodies(
          metaBodies,
          entry.path,
          entry.linkpath || undefined
        )) {
          addViolation(entry, pax.code, pax.reason, entry.path)
          approved = false
        }

        // validateEntry performs every per-string syntactic check (NUL and
        // other control characters, glob metacharacters, UNC / absolute /
        // drive-relative forms) on BOTH the entry path and any link target,
        // plus the allowed-root containment check. Keeping all of those checks
        // in one place (pathValidation) is what makes entry paths and link
        // targets treated consistently.
        const result = validateEntry(
          entry.path,
          entry.linkpath || undefined,
          entry.type,
          preparedRoots,
          extractCwd
        )
        if (!result.ok) {
          addViolation(entry, result.code, result.reason, result.resolved)
          approved = false
        }

        // Only entries that passed every check (PAX cross-check and path
        // validation) are eligible for the extraction allow-list. When any
        // violation exists the allow-list is unused anyway — extraction is
        // either blocked in 'error' mode or runs unrestricted in 'warn' mode —
        // but tracking approval per entry keeps the contract simple.
        if (approved) {
          approvedNames.push(entry.path)
        }
      } finally {
        // Drain the entry so the parser advances. Without this the stream
        // stalls waiting for the consumer to read the entry body.
        entry.resume()
      }
    }
  })

  // Entries node-tar refuses to classify (unknown typeflag bytes, mapped
  // typeflags it doesn't extract, and oversized meta headers) are emitted on
  // `'ignoredEntry'` rather than `'entry'`, so they never reach onReadEntry.
  // A cache archive should never legitimately contain one, and system tar may
  // still extract them — so we fail closed and record each as a violation.
  parser.on('ignoredEntry', (entry: ReadEntry) => {
    // The meta header(s) that preceded an ignored entry belong to it; discard
    // them so they aren't mis-associated with a later concrete entry.
    consumePendingMeta()
    addViolation(
      entry,
      'UNSUPPORTED_TYPE',
      `parser ignored entry of type ${entry.type}`,
      entry.path
    )
  })

  // Capture the raw body of each extended-header (meta) entry. node-tar
  // decodes the body to a string before emitting it; we re-encode to bytes so
  // the length-correct PAX re-parser operates on the same view node-tar used.
  parser.on('meta', (metaBody: string) => {
    if (pendingMeta.length >= MAX_PENDING_META) {
      recordParseError(
        'TAR_ENTRY_INVALID',
        'too many consecutive extended headers'
      )
      return
    }
    pendingMeta.push(Buffer.from(metaBody, 'utf8'))
  })

  await streamArchiveTo(archivePath, compressionMethod, parser)

  if (firstParseError) {
    throw firstParseError
  }
  return {violations, approvedNames}
}

async function streamArchiveTo(
  archivePath: string,
  compressionMethod: CompressionMethod,
  destination: NodeJS.WritableStream
): Promise<void> {
  const fileStream = createReadStream(archivePath)

  if (compressionMethod === CompressionMethod.Gzip) {
    // node-tar's Parser was constructed with `gzip: true`, so it handles
    // decompression internally — just pipe the raw file stream in.
    await pipeline(fileStream, destination)
    return
  }

  // zstd-compressed archive. node-tar does not natively decompress zstd, so
  // we shell out to the `zstd` binary the same way tar.ts does for the
  // existing extract codepath. This adds one extra decompression vs. the
  // existing extract step (which runs its own zstd), but only on archives
  // where path validation is enabled.
  const zstdArgs: string[] = ['-d', '-c']
  if (compressionMethod === CompressionMethod.Zstd) {
    zstdArgs.unshift('--long=30')
  }

  const zstd = spawn('zstd', zstdArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  // Cap stderr capture so a chatty/malicious zstd invocation can't grow
  // memory without bound. 64 KiB is plenty for any realistic error message.
  const STDERR_CAP_BYTES = 64 * 1024
  let zstdStderr = ''
  let stderrBytes = 0
  let stderrTruncated = false
  zstd.stderr.on('data', (chunk: Buffer) => {
    if (stderrBytes >= STDERR_CAP_BYTES) {
      stderrTruncated = true
      return
    }
    const remaining = STDERR_CAP_BYTES - stderrBytes
    if (chunk.length > remaining) {
      zstdStderr += chunk.subarray(0, remaining).toString()
      stderrBytes += remaining
      stderrTruncated = true
    } else {
      zstdStderr += chunk.toString()
      stderrBytes += chunk.length
    }
  })

  const zstdExited = new Promise<void>((resolve, reject) => {
    zstd.on('error', reject)
    zstd.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        // A SIGTERM here means we killed the child ourselves during cleanup
        // after an upstream failure — surface a clearer message in that
        // case rather than the bare exit code.
        const cause =
          signal !== null
            ? `terminated by signal ${signal}`
            : `exited with code ${code}`
        const tail = stderrTruncated ? ' (stderr truncated)' : ''
        reject(
          new Error(
            `zstd ${cause}${zstdStderr ? `: ${zstdStderr.trim()}` : ''}${tail}`
          )
        )
      }
    })
  })

  const stdin = zstd.stdin as unknown as NodeJS.WritableStream
  const stdout = zstd.stdout as unknown as Readable

  // Run both sides of the pipeline concurrently, plus wait for the zstd
  // process itself to exit cleanly. If decompression produces non-tar bytes
  // the destination parser will reject; if zstd exits non-zero the exit
  // promise will reject. Either way we surface the error.
  const inPromise = pipeline(fileStream, stdin)
  const outPromise = pipeline(stdout, destination)
  // Suppress unhandled-rejection warnings on the individual promises. The
  // first rejection is propagated via the Promise.all below; any later
  // rejection (e.g. zstd reporting a non-zero exit after the parser
  // already errored) would otherwise crash the process.
  inPromise.catch(() => undefined)
  outPromise.catch(() => undefined)
  zstdExited.catch(() => undefined)

  try {
    await Promise.all([inPromise, outPromise, zstdExited])
  } finally {
    if (zstd.exitCode === null && zstd.signalCode === null && !zstd.killed) {
      zstd.kill('SIGTERM')
    }
  }
}
