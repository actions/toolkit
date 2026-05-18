import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as path from 'path'
import {CompressionMethod} from '../src/internal/constants'
import * as tar from '../src/internal/tar'
import {CacheIntegrityError} from '../src/internal/cacheIntegrityError'
import * as listAndValidate from '../src/internal/listAndValidate'

jest.mock('@actions/exec')
jest.mock('@actions/io')
jest.mock('../src/internal/listAndValidate')

function getTempDir(): string {
  return path.join(__dirname, '_temp', 'tarPathValidation')
}

beforeAll(async () => {
  jest.spyOn(io, 'which').mockImplementation(async tool => tool)
  process.env['GITHUB_WORKSPACE'] = process.cwd()
  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

beforeEach(() => {
  jest.restoreAllMocks()
  jest.spyOn(io, 'which').mockImplementation(async tool => tool)
})

afterAll(async () => {
  delete process.env['GITHUB_WORKSPACE']
  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

const archive = 'cache.tar.gz'

describe('extractTar path validation integration', () => {
  describe("mode 'off' (default)", () => {
    test('does not call listAndValidate when no options passed', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip)

      expect(listMock).not.toHaveBeenCalled()
      expect(execMock).toHaveBeenCalledTimes(1) // system tar still runs
    })

    test("explicit pathValidation='off' skips validation", async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'off'
      })

      expect(listMock).not.toHaveBeenCalled()
      expect(execMock).toHaveBeenCalledTimes(1)
    })
  })

  describe("mode 'warn'", () => {
    test('clean archive: no warnings emitted, extraction proceeds', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      const warnSpy = jest.spyOn(core, 'warning').mockImplementation()
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      expect(listMock).toHaveBeenCalledTimes(1)
      expect(warnSpy).not.toHaveBeenCalled()
      expect(execMock).toHaveBeenCalledTimes(1)
    })

    test('violations present: exactly one warning, debug per violation, extraction still proceeds', async () => {
      jest.spyOn(listAndValidate, 'listAndValidate').mockResolvedValue([
        {
          path: '../escape.txt',
          resolved: '',
          entryType: 'File',
          code: 'OUTSIDE_ROOTS',
          reason: 'escapes allowed roots'
        },
        {
          path: 'cache/link',
          linkpath: '/etc/passwd',
          resolved: '',
          entryType: 'SymbolicLink',
          code: 'LINK_OUTSIDE_ROOTS',
          reason: 'symlink target outside allowed roots'
        }
      ])
      const warnSpy = jest.spyOn(core, 'warning').mockImplementation()
      const debugSpy = jest.spyOn(core, 'debug').mockImplementation()
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      // Exactly one summary warning
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toMatch(/2 entries/)
      expect(warnSpy.mock.calls[0][0]).not.toMatch(/failed integrity/)
      // One debug entry per violation
      expect(debugSpy).toHaveBeenCalledTimes(2)
      expect(debugSpy.mock.calls[0][0]).toMatch(/path-validation/)
      // Extraction still happens
      expect(execMock).toHaveBeenCalledTimes(1)
    })

    test('single violation: warning text uses singular wording', async () => {
      jest.spyOn(listAndValidate, 'listAndValidate').mockResolvedValue([
        {
          path: '../boom.txt',
          resolved: '',
          entryType: 'File',
          code: 'OUTSIDE_ROOTS',
          reason: 'escapes'
        }
      ])
      const warnSpy = jest.spyOn(core, 'warning').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      expect(warnSpy.mock.calls[0][0]).toMatch(/1 entry/)
    })
  })

  describe("mode 'error'", () => {
    test('violations present: throws CacheIntegrityError, system tar NEVER invoked', async () => {
      jest.spyOn(listAndValidate, 'listAndValidate').mockResolvedValue([
        {
          path: '../etc/passwd',
          resolved: '',
          entryType: 'File',
          code: 'OUTSIDE_ROOTS',
          reason: 'escapes allowed roots'
        }
      ])
      jest.spyOn(core, 'warning').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)
      const mkdirMock = jest.spyOn(io, 'mkdirP').mockResolvedValue()

      await expect(
        tar.extractTar(archive, CompressionMethod.Gzip, {
          declaredPaths: ['cache/**'],
          pathValidation: 'error'
        })
      ).rejects.toThrow(CacheIntegrityError)

      // The critical security assertion: no extraction directory was created
      // and system tar was never invoked.
      expect(execMock).not.toHaveBeenCalled()
      expect(mkdirMock).not.toHaveBeenCalled()
    })

    test('thrown error has code PATH_VIOLATION and exposes violations', async () => {
      const violations = [
        {
          path: '../boom.txt',
          resolved: '',
          entryType: 'File' as const,
          code: 'OUTSIDE_ROOTS' as const,
          reason: 'escapes'
        }
      ]
      jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue(violations)
      jest.spyOn(core, 'warning').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()

      try {
        await tar.extractTar(archive, CompressionMethod.Gzip, {
          declaredPaths: ['cache/**'],
          pathValidation: 'error'
        })
        fail('expected CacheIntegrityError')
      } catch (err) {
        expect(err).toBeInstanceOf(CacheIntegrityError)
        const e = err as CacheIntegrityError
        expect(e.code).toBe('PATH_VIOLATION')
        expect(e.violations).toEqual(violations)
        expect(e.message).toMatch(/Refusing to extract/)
      }
    })

    test('clean archive: no throw, extraction proceeds normally', async () => {
      jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      const warnSpy = jest.spyOn(core, 'warning').mockImplementation()
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'error'
      })

      expect(warnSpy).not.toHaveBeenCalled()
      expect(execMock).toHaveBeenCalledTimes(1)
    })

    test('listAndValidate throws parse error: wrapped as CacheIntegrityError(PARSE_ERROR), no extraction', async () => {
      jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockRejectedValue(new Error('tar parse error (TAR_BAD_ARCHIVE): bad'))
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)
      const mkdirMock = jest.spyOn(io, 'mkdirP').mockResolvedValue()

      try {
        await tar.extractTar(archive, CompressionMethod.Gzip, {
          declaredPaths: ['cache/**'],
          pathValidation: 'error'
        })
        fail('expected throw')
      } catch (err) {
        expect(err).toBeInstanceOf(CacheIntegrityError)
        expect((err as CacheIntegrityError).code).toBe('PARSE_ERROR')
        expect((err as CacheIntegrityError).message).toMatch(
          /tar parse error/
        )
      }
      expect(execMock).not.toHaveBeenCalled()
      expect(mkdirMock).not.toHaveBeenCalled()
    })

    test("listAndValidate parse failure in 'warn' mode: logs warning, skips validation, extraction proceeds", async () => {
      jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockRejectedValue(new Error('bad bytes'))
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0)
      const warnSpy = jest.spyOn(core, 'warning').mockImplementation()

      // In 'warn' mode a parse failure is non-fatal: the validator's tar
      // parser is stricter than the system `tar` that performs the actual
      // extraction, so the archive may still extract cleanly. We log a
      // warning and proceed.
      await expect(
        tar.extractTar(archive, CompressionMethod.Gzip, {
          declaredPaths: ['cache/**'],
          pathValidation: 'warn'
        })
      ).resolves.toBeUndefined()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toMatch(/integrity check failed/)
      expect(warnSpy.mock.calls[0][0]).toMatch(/bad bytes/)
      expect(execMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('allowed-roots derivation', () => {
    test('declaredPaths is forwarded to listAndValidate', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['build/', 'node_modules/'],
        pathValidation: 'warn'
      })

      expect(listMock).toHaveBeenCalledTimes(1)
      const [, , allowedRoots] = listMock.mock.calls[0]
      // Both declared roots should appear after resolution
      expect(allowedRoots.length).toBeGreaterThanOrEqual(2)
    })

    test('missing declaredPaths falls back to workspace as the sole allowed root', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        pathValidation: 'warn'
      })

      expect(listMock).toHaveBeenCalledTimes(1)
      const [, , allowedRoots, extractCwd] = listMock.mock.calls[0]
      // Empty declaredPaths array → fail-safe fallback to extractCwd
      expect(allowedRoots).toEqual([extractCwd])
    })
  })

  describe('compression method forwarding', () => {
    test('Gzip', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Gzip, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      expect(listMock.mock.calls[0][1]).toBe(CompressionMethod.Gzip)
    })

    test('Zstd', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.Zstd, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      expect(listMock.mock.calls[0][1]).toBe(CompressionMethod.Zstd)
    })

    test('ZstdWithoutLong', async () => {
      const listMock = jest
        .spyOn(listAndValidate, 'listAndValidate')
        .mockResolvedValue([])
      jest.spyOn(exec, 'exec').mockResolvedValue(0)

      await tar.extractTar(archive, CompressionMethod.ZstdWithoutLong, {
        declaredPaths: ['cache/**'],
        pathValidation: 'warn'
      })

      expect(listMock.mock.calls[0][1]).toBe(
        CompressionMethod.ZstdWithoutLong
      )
    })
  })
})
