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

/**
 * Stream the entries of a (possibly compressed) tar archive and validate each
 * against the allowed roots. Does NOT extract any files — entries are read
 * for header inspection only. Returns the list of violations (empty if the
 * archive is clean).
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
): Promise<PathValidationViolation[]> {
  const violations: PathValidationViolation[] = []

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
        const result = validateEntry(
          entry.path,
          entry.linkpath || undefined,
          entry.type,
          preparedRoots,
          extractCwd
        )
        if (!result.ok) {
          violations.push({
            path: entry.path,
            linkpath: entry.linkpath || undefined,
            resolved: result.resolved,
            entryType: entry.type,
            code: result.code,
            reason: result.reason
          })
        }
      } finally {
        // Drain the entry so the parser advances. Without this the stream
        // stalls waiting for the consumer to read the entry body.
        entry.resume()
      }
    }
  })

  await streamArchiveTo(archivePath, compressionMethod, parser)

  if (firstParseError) {
    throw firstParseError
  }
  return violations
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
