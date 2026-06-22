import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
  readFileSync
} from 'fs'
import * as os from 'os'
import * as path from 'path'
import {gzipSync} from 'zlib'
import {execSync} from 'child_process'
import {CompressionMethod} from '../src/internal/constants'
import {listAndValidate} from '../src/internal/listAndValidate'
import {extractTar} from '../src/internal/tar'
import {CacheIntegrityError} from '../src/internal/cacheIntegrityError'

/**
 * Parser-differential bypass regression tests. Each case builds a malicious
 * archive as raw tar bytes (so we can craft PAX bodies and typeflags that
 * node-tar's Header encoder would never produce) designed to make node-tar's
 * in-process listing disagree with the path the system `tar` extractor would
 * write to, then asserts the validator refuses it. The vectors covered are: an
 * unknown typeflag byte, a PAX `path=` / `linkpath=` record with an embedded
 * newline, an oversized PAX header, and a GNU sparse typeflag.
 */

// ---------------------------------------------------------------------------
// Raw tar construction
// ---------------------------------------------------------------------------

const BLOCK = 512

function octal(n: number, len: number): Buffer {
  return Buffer.from(`${n.toString(8).padStart(len - 1, '0')}\0`, 'ascii')
}

function put(
  buf: Buffer,
  offset: number,
  data: string | Buffer,
  max: number
): void {
  const b = Buffer.isBuffer(data) ? data : Buffer.from(data, 'ascii')
  b.copy(buf, offset, 0, Math.min(b.length, max))
}

function header(opts: {
  name?: string
  mode?: number
  size?: number
  typeflag?: string
  linkname?: string
}): Buffer {
  const {
    name = '',
    mode = 0o644,
    size = 0,
    typeflag = '0',
    linkname = ''
  } = opts
  const h = Buffer.alloc(BLOCK)
  put(h, 0, name, 100)
  octal(mode, 8).copy(h, 100)
  octal(0, 8).copy(h, 108)
  octal(0, 8).copy(h, 116)
  octal(size, 12).copy(h, 124)
  octal(0, 12).copy(h, 136)
  h.fill(0x20, 148, 156) // chksum field = spaces while summing
  put(h, 156, typeflag, 1)
  put(h, 157, linkname, 100)
  put(h, 257, 'ustar\0', 6)
  put(h, 263, '00', 2)
  let sum = 0
  for (let i = 0; i < BLOCK; i++) sum += h[i]
  put(h, 148, `${sum.toString(8).padStart(6, '0')}\0 `, 8)
  return h
}

function pad(buf: Buffer): Buffer {
  const p = (BLOCK - (buf.length % BLOCK)) % BLOCK
  return p > 0 ? Buffer.concat([buf, Buffer.alloc(p)]) : buf
}

function fileEntry(name: string, contents: string, typeflag = '0'): Buffer {
  const body = Buffer.from(contents, 'ascii')
  return Buffer.concat([header({name, size: body.length, typeflag}), pad(body)])
}

function dirEntry(name: string): Buffer {
  return header({
    name: name.endsWith('/') ? name : `${name}/`,
    mode: 0o755,
    typeflag: '5'
  })
}

function paxEntry(body: Buffer): Buffer {
  return Buffer.concat([
    header({name: 'PaxHeader', size: body.length, typeflag: 'x'}),
    pad(body)
  ])
}

function end(): Buffer {
  return Buffer.alloc(BLOCK * 2)
}

/** Build a single length-correct PAX record (`"<len> <key>=<value>\n"`). */
function paxRecord(content: string): string {
  const base = 1 + Buffer.byteLength(content) + 1
  let len = base + String(base).length
  if (String(len).length !== String(base).length) {
    len = base + String(len).length
  }
  return `${len} ${content}\n`
}

// ---------------------------------------------------------------------------
// Malicious archives
// ---------------------------------------------------------------------------

// Unknown typeflag byte ('Z') is emitted by node-tar as an ignoredEntry, but
// system tar would extract it as a regular file.
const unknownTypeflagArchive = Buffer.concat([
  fileEntry('cache/safe.txt', 'ok'),
  fileEntry('../../../../../../tmp/escaped_unknown_type', 'pwned', 'Z'),
  end()
])

// PAX `path=` record whose value carries an embedded newline. node-tar's naive
// `split('\n')` parse resolves the trailing `path=safe.txt`, while a
// length-correct parse (matching system tar) resolves the escaping path.
const paxPathNewlineArchive = Buffer.concat([
  paxEntry(
    Buffer.from(
      '42 path=../../../../../../tmp/escaped_pax\n30 comment=x\n17 path=safe.txt\n',
      'ascii'
    )
  ),
  fileEntry('cache/safe.txt', 'pwned'),
  end()
])

// The same embedded-newline differential applied to a symlink's `linkpath=`.
const paxLinkpathNewlineArchive = Buffer.concat([
  paxEntry(
    Buffer.from(
      '34 linkpath=../../../../../../tmp\n37 comment=x\n24 linkpath=safe/target\n',
      'ascii'
    )
  ),
  header({name: 'cache/link', typeflag: '2', linkname: 'safe/target'}),
  end()
])

// Oversized PAX header (> 1 MiB) is dropped by node-tar's maxMetaEntrySize and
// would otherwise let the `path=` override slip through unseen.
const oversizedPaxHeaderArchive = Buffer.concat([
  paxEntry(
    Buffer.concat([
      Buffer.from(`1048600 comment=${'A'.repeat(1048600 - 17)}\n`, 'ascii'),
      Buffer.from('42 path=../../../../../../tmp/escaped_big\n', 'ascii')
    ])
  ),
  fileEntry('cache/safe.txt', 'pwned'),
  end()
])

// GNU sparse typeflag 'S' is mapped but ignored by node-tar's ReadEntry, while
// system tar would extract it.
const sparseTypeflagArchive = Buffer.concat([
  fileEntry('cache/decoy.txt', 'ok'),
  fileEntry('../../../../../../tmp/escaped_sparse', '', 'S'),
  end()
])

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

const ROOT = mkdtempSync(path.join(os.tmpdir(), 'cache-attacks-'))

function workspace(): string {
  return path.join(ROOT, 'workspace')
}

function writeGz(name: string, archive: Buffer): string {
  mkdirSync(ROOT, {recursive: true})
  const p = path.join(ROOT, name)
  writeFileSync(p, gzipSync(archive))
  return p
}

async function validate(
  archive: Buffer,
  name: string
): Promise<{violations: string[]; approvedNames: string[]}> {
  const p = writeGz(name, archive)
  const result = await listAndValidate(
    p,
    CompressionMethod.Gzip,
    [path.join(workspace(), 'cache')],
    workspace()
  )
  return {
    violations: result.violations.map(v => v.code),
    approvedNames: result.approvedNames
  }
}

const TAR_AVAILABLE = ((): boolean => {
  try {
    execSync(process.platform === 'win32' ? 'where tar' : 'which tar', {
      stdio: 'ignore'
    })
    return true
  } catch {
    return false
  }
})()
const describeTar = TAR_AVAILABLE ? describe : describe.skip

beforeAll(() => {
  mkdirSync(workspace(), {recursive: true})
})

afterAll(() => {
  try {
    rmSync(ROOT, {recursive: true, force: true})
  } catch {
    // best-effort
  }
})

describe('listAndValidate: parser-differential bypass detection', () => {
  test('unknown typeflag is rejected as UNSUPPORTED_TYPE', async () => {
    const {violations, approvedNames} = await validate(
      unknownTypeflagArchive,
      'unknown-typeflag.tar.gz'
    )
    expect(violations).toContain('UNSUPPORTED_TYPE')
    // The escaping entry must NOT be approved for extraction.
    expect(approvedNames).not.toContain(
      '../../../../../../tmp/escaped_unknown_type'
    )
  })

  test('PAX path newline differential is rejected as PAX_DESYNC', async () => {
    const {violations, approvedNames} = await validate(
      paxPathNewlineArchive,
      'pax-path-newline.tar.gz'
    )
    expect(violations).toContain('PAX_DESYNC')
    expect(approvedNames).toEqual([])
  })

  test('PAX linkpath newline differential is rejected as PAX_DESYNC', async () => {
    const {violations} = await validate(
      paxLinkpathNewlineArchive,
      'pax-linkpath-newline.tar.gz'
    )
    expect(violations).toContain('PAX_DESYNC')
  })

  test('oversized PAX header is rejected as UNSUPPORTED_TYPE', async () => {
    const {violations} = await validate(
      oversizedPaxHeaderArchive,
      'oversized-pax.tar.gz'
    )
    expect(violations).toContain('UNSUPPORTED_TYPE')
  })

  test('sparse typeflag is rejected as UNSUPPORTED_TYPE', async () => {
    const {violations, approvedNames} = await validate(
      sparseTypeflagArchive,
      'sparse-typeflag.tar.gz'
    )
    expect(violations).toContain('UNSUPPORTED_TYPE')
    expect(approvedNames).not.toContain('../../../../../../tmp/escaped_sparse')
  })

  test('glob metacharacter in entry path is rejected as GLOB_METACHAR', async () => {
    const archive = Buffer.concat([fileEntry('cache/[id].js', 'x'), end()])
    const {violations} = await validate(archive, 'glob.tar.gz')
    expect(violations).toContain('GLOB_METACHAR')
  })

  test('clean archive: approvedNames lists every concrete entry, no violations', async () => {
    const archive = Buffer.concat([
      dirEntry('cache/'),
      fileEntry('cache/file.txt', 'hi'),
      dirEntry('cache/sub/'),
      fileEntry('cache/sub/deep.txt', 'deep'),
      end()
    ])
    const {violations, approvedNames} = await validate(archive, 'clean.tar.gz')
    expect(violations).toEqual([])
    expect(approvedNames).toEqual([
      'cache/',
      'cache/file.txt',
      'cache/sub/',
      'cache/sub/deep.txt'
    ])
  })

  test('newline in entry path is rejected as UNSAFE_CHAR', async () => {
    const archive = Buffer.concat([fileEntry('cache/a\nb.txt', 'x'), end()])
    const {violations} = await validate(archive, 'newline.tar.gz')
    expect(violations).toContain('UNSAFE_CHAR')
  })

  test('NUL byte in a symlink target (via PAX) is rejected as NUL_BYTE', async () => {
    const archive = Buffer.concat([
      paxEntry(Buffer.from(paxRecord('linkpath=cache/sub/t\0'), 'ascii')),
      header({name: 'cache/link', typeflag: '2', linkname: 'cache/sub/t'}),
      end()
    ])
    const {violations} = await validate(archive, 'nul-link.tar.gz')
    expect(violations).toContain('NUL_BYTE')
  })

  test('legitimate long path via PAX: no violations, approved by its PAX path', async () => {
    const longName = `cache/${'d/'.repeat(60)}file.txt`
    const archive = Buffer.concat([
      paxEntry(Buffer.from(paxRecord(`path=${longName}`), 'ascii')),
      // ustar name is a short placeholder; the PAX `path` overrides it.
      fileEntry('cache/placeholder', 'x'),
      end()
    ])
    const {violations, approvedNames} = await validate(
      archive,
      'longpath.tar.gz'
    )
    expect(violations).toEqual([])
    expect(approvedNames).toContain(longName)
  })

  test('unknown PAX key is rejected as PAX_UNKNOWN_KEY', async () => {
    const archive = Buffer.concat([
      paxEntry(Buffer.from(paxRecord('EVIL.placement=1'), 'ascii')),
      fileEntry('cache/x', 'y'),
      end()
    ])
    const {violations} = await validate(archive, 'unknown-key.tar.gz')
    expect(violations).toContain('PAX_UNKNOWN_KEY')
  })

  test('PAX sparse (GNU.sparse.name) is rejected as PAX_UNSUPPORTED_KEY', async () => {
    // node-tar v7 ignores GNU sparse keys, so without this rejection the entry
    // would be approved under its benign header path while system tar would
    // reconstruct the file at GNU.sparse.name (here outside the cache roots).
    const sparseName = '../../../../../../tmp/escaped_sparse_pax'
    const body = Buffer.from(
      paxRecord('GNU.sparse.major=1') +
        paxRecord('GNU.sparse.minor=0') +
        paxRecord(`GNU.sparse.name=${sparseName}`) +
        paxRecord('GNU.sparse.realsize=4'),
      'ascii'
    )
    const archive = Buffer.concat([
      paxEntry(body),
      fileEntry('cache/GNUSparseFile.0/decoy', 'data'),
      end()
    ])
    const {violations, approvedNames} = await validate(archive, 'sparse.tar.gz')
    expect(violations).toContain('PAX_UNSUPPORTED_KEY')
    expect(approvedNames).not.toContain(sparseName)
  })

  test('flood of extended headers is rejected (pending-meta cap)', async () => {
    const metas: Buffer[] = []
    for (let i = 0; i < 70; i++) {
      metas.push(paxEntry(Buffer.from(paxRecord('comment=x'), 'ascii')))
    }
    const archive = Buffer.concat([...metas, fileEntry('cache/x', 'y'), end()])
    const p = writeGz('meta-flood.tar.gz', archive)
    await expect(
      listAndValidate(
        p,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
    ).rejects.toThrow()
  })
})

describeTar('extractTar end-to-end with system tar allow-list', () => {
  let savedWorkspace: string | undefined

  beforeEach(() => {
    savedWorkspace = process.env['GITHUB_WORKSPACE']
  })

  afterEach(() => {
    if (savedWorkspace === undefined) {
      delete process.env['GITHUB_WORKSPACE']
    } else {
      process.env['GITHUB_WORKSPACE'] = savedWorkspace
    }
  })

  test('error mode, clean archive: every approved member is extracted', async () => {
    const dest = mkdtempSync(path.join(ROOT, 'extract-clean-'))
    process.env['GITHUB_WORKSPACE'] = dest
    const archive = Buffer.concat([
      dirEntry('cache/'),
      fileEntry('cache/file.txt', 'hello'),
      dirEntry('cache/sub/'),
      fileEntry('cache/sub/deep.txt', 'deep'),
      end()
    ])
    const archivePath = path.join(dest, 'clean.tar.gz')
    mkdirSync(dest, {recursive: true})
    writeFileSync(archivePath, gzipSync(archive))

    await extractTar(archivePath, CompressionMethod.Gzip, {
      declaredPaths: ['cache/**'],
      pathValidation: 'error'
    })

    expect(existsSync(path.join(dest, 'cache', 'file.txt'))).toBe(true)
    expect(readFileSync(path.join(dest, 'cache', 'file.txt'), 'utf8')).toBe(
      'hello'
    )
    expect(existsSync(path.join(dest, 'cache', 'sub', 'deep.txt'))).toBe(true)
  })

  test('error mode, PAX path newline archive: throws and writes nothing to the workspace', async () => {
    const dest = mkdtempSync(path.join(ROOT, 'extract-pax-path-newline-'))
    process.env['GITHUB_WORKSPACE'] = dest
    const archivePath = path.join(dest, 'pax-path-newline.tar.gz')
    mkdirSync(dest, {recursive: true})
    writeFileSync(archivePath, gzipSync(paxPathNewlineArchive))

    await expect(
      extractTar(archivePath, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'error'
      })
    ).rejects.toThrow(CacheIntegrityError)

    // No member was extracted anywhere under the workspace.
    expect(existsSync(path.join(dest, 'cache'))).toBe(false)
    expect(existsSync(path.join(dest, 'safe.txt'))).toBe(false)
  })

  test('error mode: a leading ./ entry still extracts (allow-list name matches)', async () => {
    // node-tar surfaces the entry as `./cache/dotslash.txt`; the `-T` allow
    // list must use the canonical `cache/dotslash.txt` so the member is not
    // silently skipped. Verifies the canonicalMemberName normalization under
    // whichever system tar is present (GNU on Linux CI, BSD on macOS).
    const dest = mkdtempSync(path.join(ROOT, 'extract-dotslash-'))
    process.env['GITHUB_WORKSPACE'] = dest
    const archive = Buffer.concat([
      dirEntry('cache/'),
      fileEntry('./cache/dotslash.txt', 'dot'),
      end()
    ])
    const archivePath = path.join(dest, 'dotslash.tar.gz')
    mkdirSync(dest, {recursive: true})
    writeFileSync(archivePath, gzipSync(archive))

    await extractTar(archivePath, CompressionMethod.Gzip, {
      declaredPaths: ['cache/**'],
      pathValidation: 'error'
    })

    expect(existsSync(path.join(dest, 'cache', 'dotslash.txt'))).toBe(true)
    expect(readFileSync(path.join(dest, 'cache', 'dotslash.txt'), 'utf8')).toBe(
      'dot'
    )
  })

  test('error mode: a long path via PAX is extracted, not dropped by the allow-list', async () => {
    // > 100 bytes, so the name travels via a PAX `path=` record (and a GNU
    // long-name on creation). Exercises long-name matching in the `-T` list so
    // a legitimate long path is not silently skipped during extraction.
    const dest = mkdtempSync(path.join(ROOT, 'extract-long-'))
    process.env['GITHUB_WORKSPACE'] = dest
    const longRel = `cache/${'x'.repeat(110)}.txt`
    const archive = Buffer.concat([
      paxEntry(Buffer.from(paxRecord(`path=${longRel}`), 'ascii')),
      fileEntry('cache/placeholder', 'L'),
      end()
    ])
    const archivePath = path.join(dest, 'long.tar.gz')
    mkdirSync(dest, {recursive: true})
    writeFileSync(archivePath, gzipSync(archive))

    await extractTar(archivePath, CompressionMethod.Gzip, {
      declaredPaths: ['cache/**'],
      pathValidation: 'error'
    })

    expect(existsSync(path.join(dest, longRel))).toBe(true)
  })
})
