import * as os from 'os'
import * as path from 'path'
import {
  PathValidationViolation,
  deriveAllowedRoots,
  formatViolationSummary,
  validateEntry
} from '../src/internal/pathValidation'

const IS_WINDOWS = process.platform === 'win32'
const CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin'

describe('deriveAllowedRoots', () => {
  const cwd = IS_WINDOWS ? 'C:\\workspace' : '/workspace'

  describe('glob-prefix stripping', () => {
    test('literal absolute path is returned unchanged', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      const expected = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('star suffix strips trailing glob segment', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\bar\\*' : '/foo/bar/*'
      const expected = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('question-mark glob strips its segment', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\bar\\?c' : '/foo/bar/?c'
      const expected = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('character class strips its segment', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\[bc]\\d' : '/foo/[bc]/d'
      const expected = IS_WINDOWS ? 'C:\\foo' : '/foo'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('brace expansion strips its segment', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\{x,y}\\d' : '/foo/{x,y}/d'
      const expected = IS_WINDOWS ? 'C:\\foo' : '/foo'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('** in the middle strips at the **', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\**\\d' : '/foo/**/d'
      const expected = IS_WINDOWS ? 'C:\\foo' : '/foo'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('leading ** falls back to extraction CWD', () => {
      const expected = IS_WINDOWS ? 'C:\\workspace' : '/workspace'
      expect(deriveAllowedRoots(['**/node_modules'], cwd)).toEqual([expected])
    })

    test('single * falls back to extraction CWD', () => {
      const expected = IS_WINDOWS ? 'C:\\workspace' : '/workspace'
      expect(deriveAllowedRoots(['*'], cwd)).toEqual([expected])
    })
  })

  describe('negation handling', () => {
    test('negation pattern (! prefix) is dropped from allowed roots', () => {
      const input = IS_WINDOWS
        ? ['!C:\\foo\\secret']
        : ['!/foo/secret']
      expect(deriveAllowedRoots(input, cwd)).toEqual([])
    })

    test('negation does not subtract from a sibling allowed root', () => {
      const allowed = IS_WINDOWS ? 'C:\\foo' : '/foo'
      const negated = IS_WINDOWS ? '!C:\\foo\\secret' : '!/foo/secret'
      expect(deriveAllowedRoots([allowed, negated], cwd)).toEqual([allowed])
    })
  })

  describe('path expansion', () => {
    test('~ expands to home directory', () => {
      expect(deriveAllowedRoots(['~'], cwd)).toEqual([os.homedir()])
    })

    test('~/x expands to home/x', () => {
      const expected = path.join(os.homedir(), '.cache')
      expect(deriveAllowedRoots(['~/.cache'], cwd)).toEqual([expected])
    })

    test('${VAR} expands an environment variable', () => {
      const original = process.env['CACHE_TEST_ROOT']
      process.env['CACHE_TEST_ROOT'] = IS_WINDOWS ? 'C:\\envroot' : '/envroot'
      try {
        const expected = IS_WINDOWS ? 'C:\\envroot\\sub' : '/envroot/sub'
        expect(
          deriveAllowedRoots(['${CACHE_TEST_ROOT}/sub'], cwd)
        ).toEqual([expected])
      } finally {
        if (original === undefined) delete process.env['CACHE_TEST_ROOT']
        else process.env['CACHE_TEST_ROOT'] = original
      }
    })

    test('$VAR style expands an environment variable', () => {
      const original = process.env['CACHE_TEST_ROOT']
      process.env['CACHE_TEST_ROOT'] = IS_WINDOWS ? 'C:\\envroot' : '/envroot'
      try {
        const expected = IS_WINDOWS ? 'C:\\envroot\\sub' : '/envroot/sub'
        expect(deriveAllowedRoots(['$CACHE_TEST_ROOT/sub'], cwd)).toEqual([
          expected
        ])
      } finally {
        if (original === undefined) delete process.env['CACHE_TEST_ROOT']
        else process.env['CACHE_TEST_ROOT'] = original
      }
    })

    test('%VAR% Windows-style expands an environment variable', () => {
      const original = process.env['CACHE_TEST_WIN_ROOT']
      process.env['CACHE_TEST_WIN_ROOT'] = IS_WINDOWS ? 'C:\\winroot' : '/winroot'
      try {
        const expected = IS_WINDOWS ? 'C:\\winroot\\sub' : '/winroot/sub'
        expect(
          deriveAllowedRoots(['%CACHE_TEST_WIN_ROOT%/sub'], cwd)
        ).toEqual([expected])
      } finally {
        if (original === undefined) delete process.env['CACHE_TEST_WIN_ROOT']
        else process.env['CACHE_TEST_WIN_ROOT'] = original
      }
    })

    test('unknown env var expands to empty string', () => {
      delete process.env['DEFINITELY_NOT_SET_VAR_XYZ123']
      // After expansion: "/sub", which is absolute on POSIX, so it stays /sub.
      // On Windows it becomes a relative path resolved against cwd.
      const result = deriveAllowedRoots(
        ['${DEFINITELY_NOT_SET_VAR_XYZ123}/sub'],
        cwd
      )
      expect(result).toHaveLength(1)
      // Just ensure no crash and produces a deterministic value.
      expect(typeof result[0]).toBe('string')
    })

    test('env value containing glob characters is preserved verbatim, not truncated', () => {
      // Regression test: an earlier implementation expanded env vars before
      // detecting glob characters, so an env value that happened to contain
      // a `*` or `{` would truncate the prefix mid-path and silently broaden
      // the allowed root. Glob detection must run on the pre-expansion text.
      const original = process.env['CACHE_TEST_ROOT']
      process.env['CACHE_TEST_ROOT'] = IS_WINDOWS
        ? 'C:\\envroot*odd'
        : '/envroot*odd'
      try {
        const expected = IS_WINDOWS
          ? 'C:\\envroot*odd\\sub'
          : '/envroot*odd/sub'
        expect(
          deriveAllowedRoots(['${CACHE_TEST_ROOT}/sub'], cwd)
        ).toEqual([expected])
      } finally {
        if (original === undefined) delete process.env['CACHE_TEST_ROOT']
        else process.env['CACHE_TEST_ROOT'] = original
      }
    })
  })

  describe('normalization', () => {
    test('trailing slash is normalized away', () => {
      const a = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      const b = IS_WINDOWS ? 'C:\\foo\\bar\\' : '/foo/bar/'
      expect(deriveAllowedRoots([a], cwd)).toEqual(deriveAllowedRoots([b], cwd))
    })

    test('relative paths resolve against CWD', () => {
      const expected = IS_WINDOWS
        ? 'C:\\workspace\\node_modules'
        : '/workspace/node_modules'
      expect(deriveAllowedRoots(['node_modules'], cwd)).toEqual([expected])
    })

    test('. resolves to CWD', () => {
      const expected = IS_WINDOWS ? 'C:\\workspace' : '/workspace'
      expect(deriveAllowedRoots(['.'], cwd)).toEqual([expected])
    })

    test('whitespace-only path is dropped', () => {
      expect(deriveAllowedRoots(['   '], cwd)).toEqual([])
    })

    test('empty string path is dropped', () => {
      expect(deriveAllowedRoots([''], cwd)).toEqual([])
    })

    test('input with embedded ./ segments normalizes', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\.\\bar' : '/foo/./bar'
      const expected = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })

    test('input with embedded ../ segments normalizes', () => {
      const input = IS_WINDOWS ? 'C:\\foo\\bar\\..\\baz' : '/foo/bar/../baz'
      const expected = IS_WINDOWS ? 'C:\\foo\\baz' : '/foo/baz'
      expect(deriveAllowedRoots([input], cwd)).toEqual([expected])
    })
  })

  describe('deduplication and subsumption', () => {
    test('identical roots are deduplicated', () => {
      const a = IS_WINDOWS ? 'C:\\foo' : '/foo'
      expect(deriveAllowedRoots([a, a], cwd)).toEqual([a])
    })

    test('child root is subsumed by parent', () => {
      const parent = IS_WINDOWS ? 'C:\\foo' : '/foo'
      const child = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([parent, child], cwd)).toEqual([parent])
    })

    test('child first then parent still results in just parent', () => {
      const parent = IS_WINDOWS ? 'C:\\foo' : '/foo'
      const child = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      expect(deriveAllowedRoots([child, parent], cwd)).toEqual([parent])
    })

    test('sibling prefix collision does NOT subsume', () => {
      // /aa is NOT a child of /a — must be kept as a separate root.
      const a = IS_WINDOWS ? 'C:\\a' : '/a'
      const aa = IS_WINDOWS ? 'C:\\aa' : '/aa'
      const result = deriveAllowedRoots([a, aa], cwd)
      expect(result).toContain(a)
      expect(result).toContain(aa)
      expect(result).toHaveLength(2)
    })

    test('completely disjoint roots are both kept', () => {
      const a = IS_WINDOWS ? 'C:\\foo' : '/foo'
      const b = IS_WINDOWS ? 'C:\\bar' : '/bar'
      const result = deriveAllowedRoots([a, b], cwd)
      expect(result).toContain(a)
      expect(result).toContain(b)
      expect(result).toHaveLength(2)
    })
  })

  if (CASE_INSENSITIVE) {
    test('case-insensitive FS: roots that differ only in case dedupe', () => {
      const lower = IS_WINDOWS ? 'C:\\foo\\bar' : '/foo/bar'
      const upper = IS_WINDOWS ? 'C:\\FOO\\bar' : '/FOO/bar'
      const result = deriveAllowedRoots([lower, upper], cwd)
      // Either form may win, but only one root should survive.
      expect(result).toHaveLength(1)
    })
  }
})

describe('validateEntry', () => {
  const cwd = IS_WINDOWS ? 'C:\\workspace' : '/workspace'
  const allowedRoots = [
    IS_WINDOWS ? 'C:\\workspace\\node_modules' : '/workspace/node_modules',
    IS_WINDOWS ? 'C:\\workspace\\.cache' : '/workspace/.cache'
  ]

  describe('legitimate entries (must pass)', () => {
    test('regular file under root', () => {
      const r = validateEntry(
        'node_modules/foo.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('deeply nested file', () => {
      const r = validateEntry(
        'node_modules/' + Array(50).fill('sub').join('/') + '/foo.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('entry with leading ./', () => {
      const r = validateEntry(
        './node_modules/foo.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('entry with non-escaping .. segment', () => {
      const r = validateEntry(
        'node_modules/sub/../foo.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('entry with double slash normalizes ok', () => {
      const r = validateEntry(
        'node_modules//foo.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('directory entry (trailing slash)', () => {
      const r = validateEntry(
        'node_modules/',
        undefined,
        'Directory',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('filename with spaces', () => {
      const r = validateEntry(
        'node_modules/My File.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('Unicode filename', () => {
      const r = validateEntry(
        'node_modules/节点/файл.js',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('hidden file (.git/HEAD)', () => {
      const r = validateEntry(
        'node_modules/.git/HEAD',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('filename containing .. as substring (not segment)', () => {
      for (const name of ['..hidden', 'file..txt', 'a..b/c']) {
        const r = validateEntry(
          'node_modules/' + name,
          undefined,
          'File',
          allowedRoots,
          cwd
        )
        expect(r.ok).toBe(true)
      }
    })

    test('symlink within same root', () => {
      const r = validateEntry(
        'node_modules/.bin/cmd',
        '../foo/bin/cmd',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('symlink crossing into a different allowed root', () => {
      const r = validateEntry(
        'node_modules/link',
        // From /workspace/node_modules/, "../.cache/x" → /workspace/.cache/x (an allowed root)
        '../.cache/x',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('hardlink within same root', () => {
      const r = validateEntry(
        'node_modules/dup.js',
        // Hardlink target is relative to extraction CWD
        'node_modules/orig.js',
        'Link',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })
  })

  describe('path traversal attacks (must reject)', () => {
    test('classic ../../etc/passwd', () => {
      const r = validateEntry(
        '../../../etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
    })

    test('inside-then-out traversal', () => {
      const r = validateEntry(
        'node_modules/../../etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
    })

    test('hidden in middle', () => {
      const r = validateEntry(
        'node_modules/sub/../../../etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
    })

    test('multiple slashes around .. still rejected', () => {
      const r = validateEntry(
        'node_modules/..//../etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
    })

    test('trailing .. inside root is allowed (does not escape)', () => {
      const r = validateEntry(
        'node_modules/sub/..',
        undefined,
        'Directory',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })
  })

  describe('absolute / UNC paths (must reject)', () => {
    test('POSIX absolute path', () => {
      const r = validateEntry(
        '/etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('ABSOLUTE_PATH')
    })

    test('POSIX root', () => {
      const r = validateEntry('/', undefined, 'Directory', allowedRoots, cwd)
      expect(r.ok).toBe(false)
    })

    test('Windows absolute path with backslash', () => {
      const r = validateEntry(
        'C:\\Windows\\System32\\drivers\\etc\\hosts',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('ABSOLUTE_PATH')
    })

    test('Windows absolute path with forward slash', () => {
      const r = validateEntry(
        'C:/Windows/System32/drivers/etc/hosts',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('ABSOLUTE_PATH')
    })

    test('Windows drive-relative (no slash)', () => {
      const r = validateEntry(
        'C:foo',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('ABSOLUTE_PATH')
    })

    test('UNC path with backslashes', () => {
      const r = validateEntry(
        '\\\\attacker\\share\\payload',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNC_PATH')
    })

    test('UNC path with forward slashes', () => {
      const r = validateEntry(
        '//attacker/share/payload',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNC_PATH')
    })

    test('UNC long-path prefix', () => {
      const r = validateEntry(
        '\\\\?\\C:\\foo',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNC_PATH')
    })
  })

  describe('NUL byte attacks (must reject)', () => {
    test('NUL in path', () => {
      const r = validateEntry(
        'node_modules/safe\0/../etc/passwd',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('NUL_BYTE')
    })

    test('NUL in symlink target', () => {
      const r = validateEntry(
        'node_modules/link',
        'safe\0/etc/passwd',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('NUL_BYTE')
    })
  })

  describe('symlink/hardlink attacks (must reject)', () => {
    test('symlink with absolute target', () => {
      const r = validateEntry(
        'node_modules/link',
        '/etc/passwd',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('LINK_OUTSIDE_ROOTS')
    })

    test('symlink with .. traversal', () => {
      const r = validateEntry(
        'node_modules/link',
        '../../../etc/passwd',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('LINK_OUTSIDE_ROOTS')
    })

    test('hardlink with absolute target', () => {
      const r = validateEntry(
        'node_modules/dup',
        '/etc/passwd',
        'Link',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('LINK_OUTSIDE_ROOTS')
    })

    test('hardlink with .. traversal', () => {
      const r = validateEntry(
        'node_modules/dup',
        '../../etc/passwd',
        'Link',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('LINK_OUTSIDE_ROOTS')
    })

    test('symlink-then-write-through-link attack: symlink target outside roots is rejected', () => {
      // This is the critical "symlink-then-write" attack:
      //   Entry 1: node_modules/x → /etc (a symlink target outside allowed roots)
      //   Entry 2: node_modules/x/payload (which extracts THROUGH entry 1's link
      //            and lands at /etc/payload)
      // We must reject Entry 1 because its target is outside the allowed roots.
      // Entry 2's nominal path looks safe, so we cannot rely on per-entry path
      // validation alone — we must catch the symlink target.
      const r = validateEntry(
        'node_modules/x',
        '/etc',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('LINK_OUTSIDE_ROOTS')
    })

    test('symlink with empty target is allowed (filtered as undefined linkpath)', () => {
      // Empty string for linkpath is treated as "no link target to validate".
      const r = validateEntry(
        'node_modules/x',
        '',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('self-referential symlink (link to .)', () => {
      const r = validateEntry(
        'node_modules/x',
        '.',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      // "." resolves to the entry's directory which is under the root.
      expect(r.ok).toBe(true)
    })
  })

  describe('unsupported entry types (must reject)', () => {
    test('CharacterDevice is rejected', () => {
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        'CharacterDevice',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('BlockDevice is rejected', () => {
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        'BlockDevice',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('FIFO is rejected', () => {
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        'FIFO',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('ContiguousFile is rejected', () => {
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        'ContiguousFile',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('unknown / future entry type is rejected by the allow-list', () => {
      // node-tar can surface an unknown typeflag byte as a non-standard
      // string. The allow-list approach guarantees we reject it rather than
      // silently passing it through to the extractor.
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        'SomeFutureType',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('arbitrary typeflag-byte string is rejected', () => {
      // Simulate an attacker-supplied non-standard typeflag like '\u0001'
      // surfacing as a literal string from the tar parser.
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        '\u0001',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })

    test('empty entry type string is rejected', () => {
      const r = validateEntry(
        'node_modules/safe',
        undefined,
        '',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('UNSUPPORTED_TYPE')
    })
  })

  describe('allow-listed entry types (must accept)', () => {
    test.each(['File', 'OldFile', 'Directory'])(
      '%s is accepted for an in-root path',
      entryType => {
        const r = validateEntry(
          'node_modules/safe',
          undefined,
          entryType,
          allowedRoots,
          cwd
        )
        expect(r.ok).toBe(true)
      }
    )

    test('SymbolicLink is accepted for an in-root target', () => {
      const r = validateEntry(
        'node_modules/link',
        'real',
        'SymbolicLink',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('Link (hardlink) is accepted for an in-root target', () => {
      const r = validateEntry(
        'node_modules/hardlink',
        'node_modules/real',
        'Link',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })
  })

  describe('header-only entry types (must accept without validation)', () => {
    test('GlobalExtendedHeader is accepted regardless of path content', () => {
      // PAX global headers don't materialize as a file; their "path" is metadata.
      const r = validateEntry(
        '/anything/at/all',
        undefined,
        'GlobalExtendedHeader',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('ExtendedHeader is accepted', () => {
      const r = validateEntry(
        'PaxHeader/path-doesnt-matter',
        undefined,
        'ExtendedHeader',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('NextFileHasLongPath is accepted', () => {
      const r = validateEntry(
        '@LongLink',
        undefined,
        'NextFileHasLongPath',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('NextFileHasLongLinkpath is accepted', () => {
      const r = validateEntry(
        '@LongLink',
        undefined,
        'NextFileHasLongLinkpath',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })
  })

  describe('control characters in filenames (legal but unusual)', () => {
    test('embedded newline is treated literally as part of the segment', () => {
      // node-tar reports the full filename including the embedded newline.
      // It's a single segment under node_modules — must be accepted.
      const r = validateEntry(
        'node_modules/file\nwith newline',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })

    test('embedded tab is accepted', () => {
      const r = validateEntry(
        'node_modules/file\twith tab',
        undefined,
        'File',
        allowedRoots,
        cwd
      )
      expect(r.ok).toBe(true)
    })
  })

  describe('case sensitivity', () => {
    if (CASE_INSENSITIVE) {
      test('on Windows/macOS, NODE_MODULES matches node_modules', () => {
        const r = validateEntry(
          'NODE_MODULES/foo.js',
          undefined,
          'File',
          allowedRoots,
          cwd
        )
        expect(r.ok).toBe(true)
      })
    } else {
      test('on Linux, NODE_MODULES does NOT match node_modules', () => {
        const r = validateEntry(
          'NODE_MODULES/foo.js',
          undefined,
          'File',
          allowedRoots,
          cwd
        )
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
      })
    }
  })

  describe('sibling-prefix non-collision', () => {
    test('an entry under /foo-extra is NOT accepted by allowed-root /foo', () => {
      const roots = [IS_WINDOWS ? 'C:\\workspace\\foo' : '/workspace/foo']
      const r = validateEntry(
        '../foo-extra/payload',
        undefined,
        'File',
        roots,
        IS_WINDOWS ? 'C:\\workspace\\foo' : '/workspace/foo'
      )
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('OUTSIDE_ROOTS')
    })
  })
})

describe('formatViolationSummary', () => {
  function v(reason: string): PathValidationViolation {
    return {
      path: 'x',
      resolved: '',
      entryType: 'File',
      code: 'OUTSIDE_ROOTS',
      reason
    }
  }

  test('empty list produces empty string', () => {
    expect(formatViolationSummary([])).toBe('')
  })

  test('shows up to maxShown items verbatim', () => {
    const out = formatViolationSummary(
      [v('a'), v('b'), v('c')],
      5
    )
    expect(out).toContain('  - a')
    expect(out).toContain('  - b')
    expect(out).toContain('  - c')
    expect(out).not.toContain('more')
  })

  test('truncates excess items with summary line', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(v)
    const out = formatViolationSummary(items, 3)
    expect(out).toContain('  - a')
    expect(out).toContain('  - b')
    expect(out).toContain('  - c')
    expect(out).toContain('and 4 more')
    expect(out).not.toContain('  - d')
  })
})
