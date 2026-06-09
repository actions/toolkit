import {mkdirSync, mkdtempSync, writeFileSync, rmSync} from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as zlib from 'zlib'
import {execSync} from 'child_process'
import {Header} from 'tar'
import {CompressionMethod} from '../src/internal/constants'
import {listAndValidate} from '../src/internal/listAndValidate'

/**
 * Real-archive integration tests for listAndValidate. These build small tar
 * archives in-memory using `tar.Header`, write them to disk, and run them
 * through the same parser the production code uses. No mocks.
 */

interface TestEntry {
  path: string
  type: 'File' | 'Directory' | 'SymbolicLink' | 'Link' | 'CharacterDevice'
  linkpath?: string
  body?: Buffer
}

function buildTarArchive(entries: TestEntry[]): Buffer {
  const blocks: Buffer[] = []
  for (const entry of entries) {
    const body = entry.body ?? Buffer.alloc(0)
    const header = new Header({
      path: entry.path,
      mode: 0o644,
      uid: 0,
      gid: 0,
      size: body.length,
      mtime: new Date(0),
      type: entry.type,
      linkpath: entry.linkpath,
      uname: 'root',
      gname: 'root'
    })
    const headerBuf = Buffer.alloc(512)
    header.encode(headerBuf, 0)
    blocks.push(headerBuf)
    if (body.length > 0) {
      blocks.push(body)
      const pad = (512 - (body.length % 512)) % 512
      if (pad > 0) blocks.push(Buffer.alloc(pad))
    }
  }
  // Two zero blocks mark end of archive.
  blocks.push(Buffer.alloc(1024))
  return Buffer.concat(blocks)
}

const TEST_ROOT = mkdtempSync(path.join(os.tmpdir(), 'cache-listAndValidate-'))

/**
 * Detect whether the `zstd` binary is on PATH at module load. We use a
 * conditional `describe.skip` (rather than per-test early-returns) so that
 * Jest reports skipped tests as `skipped` in its summary — silently
 * `return`-ing from a test reports it as `passed`, which masks coverage gaps
 * on machines where zstd is missing.
 */
const ZSTD_AVAILABLE = ((): boolean => {
  try {
    execSync(process.platform === 'win32' ? 'where zstd' : 'which zstd', {
      stdio: 'ignore'
    })
    return true
  } catch {
    return false
  }
})()
const describeZstd = ZSTD_AVAILABLE ? describe : describe.skip

function workspace(): string {
  return path.join(TEST_ROOT, 'workspace')
}

function writeArchive(name: string, data: Buffer): string {
  mkdirSync(TEST_ROOT, {recursive: true})
  const fullPath = path.join(TEST_ROOT, name)
  writeFileSync(fullPath, data)
  return fullPath
}

beforeAll(() => {
  mkdirSync(workspace(), {recursive: true})
})

afterAll(() => {
  try {
    rmSync(TEST_ROOT, {recursive: true, force: true})
  } catch {
    // best-effort cleanup
  }
})

describe('listAndValidate (real archives)', () => {
  describe('uncompressed tar', () => {
    test('clean archive: zero violations', async () => {
      const archive = buildTarArchive([
        {path: 'cache/file1.txt', type: 'File', body: Buffer.from('hello')},
        {path: 'cache/sub/file2.txt', type: 'File', body: Buffer.from('world')},
        {path: 'cache/sub/', type: 'Directory'}
      ])
      const archivePath = writeArchive('clean.tar', archive)
      // Inject a fake gzip header by re-compressing? No — we want to test
      // the uncompressed path. listAndValidate doesn't have a "raw" code
      // path; it always assumes compression based on `compressionMethod`.
      // To test uncompressed bytes we run it through gzip and pass Gzip.
      const gzipped = zlib.gzipSync(archive)
      writeFileSync(archivePath, gzipped)

      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toEqual([])
    })
  })

  describe('gzip-compressed tar', () => {
    test('clean archive: zero violations', async () => {
      const archive = buildTarArchive([
        {path: 'cache/file.txt', type: 'File', body: Buffer.from('hi')}
      ])
      const archivePath = writeArchive('clean.tar.gz', zlib.gzipSync(archive))
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toEqual([])
    })

    test('classic ../../../etc/passwd traversal: one violation', async () => {
      const archive = buildTarArchive([
        {path: 'cache/legit.txt', type: 'File', body: Buffer.from('ok')},
        {
          path: '../../../etc/passwd',
          type: 'File',
          body: Buffer.from('pwned')
        }
      ])
      const archivePath = writeArchive(
        'traversal.tar.gz',
        zlib.gzipSync(archive)
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
      expect(violations[0].path).toBe('../../../etc/passwd')
      expect(violations[0].entryType).toBe('File')
    })

    test('absolute path entry: one violation', async () => {
      const absPath =
        process.platform === 'win32'
          ? 'C:/Windows/System32/evil.dll'
          : '/etc/cron.d/evil'
      const archive = buildTarArchive([
        {path: absPath, type: 'File', body: Buffer.from('x')}
      ])
      const archivePath = writeArchive('abs.tar.gz', zlib.gzipSync(archive))
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
      expect(violations[0].path).toBe(absPath)
    })

    test('symlink with absolute target: one violation', async () => {
      const archive = buildTarArchive([
        {
          path: 'cache/link',
          type: 'SymbolicLink',
          linkpath: '/etc/passwd'
        }
      ])
      const archivePath = writeArchive(
        'symlink-abs.tar.gz',
        zlib.gzipSync(archive)
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
      expect(violations[0].entryType).toBe('SymbolicLink')
      expect(violations[0].linkpath).toBe('/etc/passwd')
    })

    test('symlink target traversing out of allowed roots: one violation', async () => {
      const archive = buildTarArchive([
        {
          path: 'cache/link',
          type: 'SymbolicLink',
          linkpath: '../../../etc/passwd'
        }
      ])
      const archivePath = writeArchive(
        'symlink-traverse.tar.gz',
        zlib.gzipSync(archive)
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
    })

    test('hardlink to ../etc/passwd: one violation', async () => {
      const archive = buildTarArchive([
        {
          path: 'cache/link',
          type: 'Link',
          linkpath: '../../../etc/passwd'
        }
      ])
      const archivePath = writeArchive(
        'hardlink-traverse.tar.gz',
        zlib.gzipSync(archive)
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
      expect(violations[0].entryType).toBe('Link')
    })

    test('mixed clean and malicious entries: only the bad ones are reported', async () => {
      const archive = buildTarArchive([
        {path: 'cache/a.txt', type: 'File', body: Buffer.from('1')},
        {path: '../escape.txt', type: 'File', body: Buffer.from('2')},
        {path: 'cache/sub/b.txt', type: 'File', body: Buffer.from('3')},
        {
          path: 'cache/link',
          type: 'SymbolicLink',
          linkpath: '/tmp/x'
        },
        {path: 'cache/sub/c.txt', type: 'File', body: Buffer.from('4')}
      ])
      const archivePath = writeArchive('mixed.tar.gz', zlib.gzipSync(archive))
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      const paths = violations.map(v => v.path).sort()
      expect(paths).toEqual(['../escape.txt', 'cache/link'])
    })

    test('character device entry is rejected', async () => {
      const archive = buildTarArchive([
        {path: 'cache/dev', type: 'CharacterDevice'}
      ])
      const archivePath = writeArchive('chardev.tar.gz', zlib.gzipSync(archive))
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
      expect(violations[0].entryType).toBe('CharacterDevice')
    })

    test('archive with a single small entry: zero violations', async () => {
      const archive = buildTarArchive([
        {path: 'cache/tiny.txt', type: 'File', body: Buffer.from('1')}
      ])
      const archivePath = writeArchive('single.tar.gz', zlib.gzipSync(archive))
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Gzip,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toEqual([])
    })

    test('corrupted / non-tar bytes: throws Error', async () => {
      const archivePath = writeArchive(
        'corrupt.tar.gz',
        zlib.gzipSync(Buffer.from('this is not a tar archive at all'))
      )
      await expect(
        listAndValidate(
          archivePath,
          CompressionMethod.Gzip,
          [path.join(workspace(), 'cache')],
          workspace()
        )
      ).rejects.toThrow()
    })
  })

  describeZstd('zstd-compressed tar', () => {
    test('clean archive (Zstd with --long): zero violations', async () => {
      const archive = buildTarArchive([
        {path: 'cache/x.bin', type: 'File', body: Buffer.from('hello')}
      ])
      // Compress via the zstd binary with --long=30 to mirror the real
      // cache-creation pipeline.
      const archivePath = path.join(TEST_ROOT, 'clean.tar.zst')
      mkdirSync(TEST_ROOT, {recursive: true})
      writeFileSync(`${archivePath}.raw`, archive)
      execSync(
        `zstd --long=30 --force -o "${archivePath}" "${archivePath}.raw"`,
        {stdio: 'ignore'}
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Zstd,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toEqual([])
    })

    test('traversal in zstd archive: one violation', async () => {
      const archive = buildTarArchive([
        {path: '../escape.txt', type: 'File', body: Buffer.from('x')}
      ])
      const archivePath = path.join(TEST_ROOT, 'evil.tar.zst')
      writeFileSync(`${archivePath}.raw`, archive)
      execSync(
        `zstd --long=30 --force -o "${archivePath}" "${archivePath}.raw"`,
        {stdio: 'ignore'}
      )
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.Zstd,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toHaveLength(1)
    })

    test('ZstdWithoutLong compression method works', async () => {
      const archive = buildTarArchive([
        {path: 'cache/y.bin', type: 'File', body: Buffer.from('z')}
      ])
      const archivePath = path.join(TEST_ROOT, 'clean.short.tar.zst')
      writeFileSync(`${archivePath}.raw`, archive)
      execSync(`zstd --force -o "${archivePath}" "${archivePath}.raw"`, {
        stdio: 'ignore'
      })
      const violations = await listAndValidate(
        archivePath,
        CompressionMethod.ZstdWithoutLong,
        [path.join(workspace(), 'cache')],
        workspace()
      )
      expect(violations).toEqual([])
    })
  })
})
