import * as io from '../../io/src/io'
import * as os from 'os'
import * as path from 'path'
import {MatchKind} from '../src/internal-match-kind'
import {promises as fs} from 'fs'
import {Pattern} from '../src/internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

describe('pattern', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('counts leading negate markers', () => {
    const actual = [
      '/initial-includes/*.txt',
      '!!/hello/two-negate-markers.txt',
      '!!!!/hello/four-negate-markers.txt',
      '!/initial-includes/one-negate-markers.txt',
      '!!!/initial-includes/three-negate-markers.txt'
    ].map(x => new Pattern(x).negate)
    expect(actual).toEqual([false, false, false, true, true])
  })

  it('escapes homedir', async () => {
    const home = path.join(getTestTemp(), 'home-with-[and]')
    await fs.mkdir(home, {recursive: true})
    const pattern = new Pattern('~/m*', false, undefined, home)

    expect(pattern.searchPath).toBe(home)
    expect(pattern.match(path.join(home, 'match'))).toBeTruthy()
    expect(pattern.match(path.join(home, 'not-match'))).toBeFalsy()
  })

  it('escapes root', async () => {
    const originalCwd = process.cwd()
    const rootPath = path.join(getTestTemp(), 'cwd-with-[and]')
    await fs.mkdir(rootPath, {recursive: true})
    try {
      process.chdir(rootPath)

      // Relative
      let pattern = new Pattern('m*')
      expect(pattern.searchPath).toBe(rootPath)
      expect(pattern.match(path.join(rootPath, 'match'))).toBeTruthy()
      expect(pattern.match(path.join(rootPath, 'not-match'))).toBeFalsy()

      if (IS_WINDOWS) {
        const currentDrive = process.cwd().substr(0, 2)
        expect(currentDrive.match(/^[A-Z]:$/i)).toBeTruthy()

        // Relative current drive letter, e.g. C:m*
        pattern = new Pattern(`${currentDrive}m*`)
        expect(pattern.searchPath).toBe(rootPath)
        expect(pattern.match(path.join(rootPath, 'match'))).toBeTruthy()
        expect(pattern.match(path.join(rootPath, 'not-match'))).toBeFalsy()

        // Relative current drive, e.g. \path\to\cwd\m*
        pattern = new Pattern(
          `${Pattern.globEscape(process.cwd().substr(2))}\\m*`
        )
        expect(pattern.searchPath).toBe(rootPath)
        expect(pattern.match(path.join(rootPath, 'match'))).toBeTruthy()
        expect(pattern.match(path.join(rootPath, 'not-match'))).toBeFalsy()
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  it('globstar matches immediately preceding directory', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const pattern = new Pattern(`${root}foo/bar/**`)
    const actual = [
      root,
      `${root}foo`,
      `${root}foo/bar`,
      `${root}foo/bar/baz`
    ].map(x => pattern.match(x))
    expect(actual).toEqual([
      MatchKind.None,
      MatchKind.None,
      MatchKind.All,
      MatchKind.All
    ])
  })

  it('is case insensitive match on Windows', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const pattern = new Pattern(`${root}Foo/**/Baz`)
    expect(pattern.match(`${root}Foo/Baz`)).toBe(MatchKind.All)
    expect(pattern.match(`${root}Foo/bAZ`)).toBe(
      IS_WINDOWS ? MatchKind.All : MatchKind.None
    )
    expect(pattern.match(`${root}fOO/Baz`)).toBe(
      IS_WINDOWS ? MatchKind.All : MatchKind.None
    )
    expect(pattern.match(`${root}fOO/bar/bAZ`)).toBe(
      IS_WINDOWS ? MatchKind.All : MatchKind.None
    )
  })

  it('is case insensitive partial match on Windows', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const pattern = new Pattern(`${root}Foo/Bar/**/Baz`)
    expect(pattern.partialMatch(`${root}Foo`)).toBeTruthy()
    expect(pattern.partialMatch(`${root}fOO`)).toBe(IS_WINDOWS ? true : false)
  })

  it('matches root', () => {
    const pattern = new Pattern(IS_WINDOWS ? 'C:\\**' : '/**')
    expect(pattern.match(IS_WINDOWS ? 'C:\\' : '/')).toBe(MatchKind.All)
  })

  it('partial matches root', () => {
    if (IS_WINDOWS) {
      let pattern = new Pattern('C:\\foo\\**')
      expect(pattern.partialMatch('c:\\')).toBeTruthy()
      pattern = new Pattern('c:\\foo\\**')
      expect(pattern.partialMatch('C:\\')).toBeTruthy()
    } else {
      const pattern = new Pattern('/foo/**')
      expect(pattern.partialMatch('/')).toBeTruthy()
    }
  })

  it('replaces leading . segment', () => {
    // Pattern is '.'
    let pattern = new Pattern('.')
    expect(pattern.match(process.cwd())).toBe(MatchKind.All)
    expect(pattern.match(path.join(process.cwd(), 'foo'))).toBe(MatchKind.None)

    // Pattern is './foo'
    pattern = new Pattern('./foo')
    expect(pattern.match(path.join(process.cwd(), 'foo'))).toBe(MatchKind.All)
    expect(pattern.match(path.join(process.cwd(), 'bar'))).toBe(MatchKind.None)

    // Pattern is '.foo'
    pattern = new Pattern('.foo')
    expect(pattern.match(path.join(process.cwd(), '.foo'))).toBe(MatchKind.All)
    expect(pattern.match(path.join(process.cwd(), 'foo'))).toBe(MatchKind.None)
    expect(pattern.match(`${process.cwd()}foo`)).toBe(MatchKind.None)
  })

  it('replaces leading ~ segment', async () => {
    const homedir = os.homedir()
    expect(homedir).toBeTruthy()
    await fs.stat(homedir)

    // Pattern is '~'
    let pattern = new Pattern('~')
    expect(pattern.match(homedir)).toBe(MatchKind.All)
    expect(pattern.match(path.join(homedir, 'foo'))).toBe(MatchKind.None)

    // Pattern is '~/foo'
    pattern = new Pattern('~/foo')
    expect(pattern.match(path.join(homedir, 'foo'))).toBe(MatchKind.All)
    expect(pattern.match(path.join(homedir, 'bar'))).toBe(MatchKind.None)

    // Pattern is '~foo'
    pattern = new Pattern('~foo')
    expect(pattern.match(path.join(process.cwd(), '~foo'))).toBe(MatchKind.All)
    expect(pattern.match(path.join(homedir, 'foo'))).toBe(MatchKind.None)
    expect(pattern.match(`${homedir}foo`)).toBe(MatchKind.None)
  })

  it('replaces leading relative root', () => {
    if (IS_WINDOWS) {
      const currentDrive = process.cwd().substr(0, 2)
      expect(currentDrive.match(/^[A-Z]:$/i)).toBeTruthy()
      const otherDrive = currentDrive.toUpperCase().startsWith('C')
        ? 'D:'
        : 'C:'
      expect(process.cwd().length).toBeGreaterThan(3) // sanity check not drive root

      // Pattern is 'C:'
      let pattern = new Pattern(currentDrive)
      expect(pattern.match(process.cwd())).toBeTruthy()
      expect(pattern.match(path.join(process.cwd(), 'foo'))).toBeFalsy()

      // Pattern is 'C:foo'
      pattern = new Pattern(`${currentDrive}foo`)
      expect(pattern.match(path.join(process.cwd(), 'foo'))).toBeTruthy()
      expect(pattern.match(path.join(process.cwd(), 'bar'))).toBeFalsy()
      expect(pattern.match(`${currentDrive}\\foo`)).toBeFalsy()

      // Pattern is 'X:'
      pattern = new Pattern(otherDrive)
      expect(pattern.match(`${otherDrive}\\`)).toBeTruthy()
      expect(pattern.match(`${otherDrive}\\foo`)).toBeFalsy()

      // Pattern is 'X:foo'
      pattern = new Pattern(`${otherDrive}foo`)
      expect(pattern.match(`${otherDrive}\\foo`)).toBeTruthy()
      expect(pattern.match(`${otherDrive}\\bar`)).toBeFalsy()

      // Pattern is '\\path\\to\\cwd'
      pattern = new Pattern(`${process.cwd().substr(2)}\\foo`)
      expect(pattern.match(path.join(process.cwd(), 'foo'))).toBeTruthy()
      expect(pattern.match(path.join(process.cwd(), 'bar'))).toBeFalsy()
    }
  })

  it('roots exclude pattern', () => {
    const patternStrings = ['!hello.txt', '!**/world.txt']
    const actual = patternStrings.map(x => new Pattern(x))
    const expected = patternStrings
      .map(x => x.substr(1))
      .map(x => path.join(Pattern.globEscape(process.cwd()), x))
      .map(x => `!${x}`)
      .map(x => new Pattern(x))
    expect(actual.map(x => x.negate)).toEqual([true, true])
    expect(actual.map(x => x.segments)).toEqual(expected.map(x => x.segments))
  })

  it('roots include pattern', () => {
    const patternStrings = ['hello.txt', '**/world.txt']
    const actual = patternStrings.map(x => new Pattern(x))
    const expected = patternStrings.map(
      x => new Pattern(path.join(Pattern.globEscape(process.cwd()), x))
    )
    expect(actual.map(x => x.segments)).toEqual(expected.map(x => x.segments))
  })

  it('sets trailing separator', () => {
    expect(new Pattern(' foo ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' /foo ').trailingSeparator).toBeFalsy()
    expect(new Pattern('! /foo ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' /foo/* ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' /foo/** ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' \\foo ').trailingSeparator).toBeFalsy()
    expect(new Pattern('! \\foo ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' \\foo\\* ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' \\foo\\** ').trailingSeparator).toBeFalsy()
    expect(new Pattern(' foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' /foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' C:/foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' C:foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' D:foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern('! /foo/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' /foo/*/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' /foo/**/ ').trailingSeparator).toBeTruthy()
    expect(new Pattern(' foo\\ ').trailingSeparator).toEqual(
      IS_WINDOWS ? true : false
    )
    expect(new Pattern(' \\foo\\ ').trailingSeparator).toEqual(
      IS_WINDOWS ? true : false
    )
    expect(new Pattern('! \\foo\\ ').trailingSeparator).toEqual(
      IS_WINDOWS ? true : false
    )
    expect(new Pattern(' \\foo\\*\\ ').trailingSeparator).toEqual(
      IS_WINDOWS ? true : false
    )
    expect(new Pattern(' \\foo\\**\\ ').trailingSeparator).toEqual(
      IS_WINDOWS ? true : false
    )
  })

  it('supports including directories only', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const pattern = new Pattern(`${root}foo/**/`) // trailing slash
    const actual = [
      root,
      `${root}foo/`,
      `${root}foo/bar`,
      `${root}foo/bar/baz`
    ].map(x => pattern.match(x))
    expect(pattern.trailingSeparator).toBeTruthy()
    expect(actual).toEqual([
      MatchKind.None,
      MatchKind.Directory,
      MatchKind.Directory,
      MatchKind.Directory
    ])
  })

  it('trims pattern', () => {
    const pattern = new Pattern(' hello.txt ')
    expect(pattern.segments.reverse()[0]).toBe('hello.txt')
  })

  it('trims whitespace after trimming negate markers', () => {
    const pattern = new Pattern(' ! ! ! hello.txt ')
    expect(pattern.negate).toBeTruthy()
    expect(pattern.segments.reverse()[0]).toBe('hello.txt')
  })

  it('unescapes segments to narrow search path', () => {
    // Positive
    const root = IS_WINDOWS ? 'C:\\' : '/'
    let pattern = new Pattern(`${root}foo/b[a]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}bar`)
    expect(pattern.match(`${root}foo/bar/baz`)).toBeTruthy()
    pattern = new Pattern(`${root}foo/b[*]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b*r`)
    expect(pattern.match(`${root}foo/b*r/baz`)).toBeTruthy()
    expect(pattern.match(`${root}foo/bar/baz`)).toBeFalsy()
    pattern = new Pattern(`${root}foo/b[?]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b?r`)
    expect(pattern.match(`${root}foo/b?r/baz`)).toBeTruthy()
    expect(pattern.match(`${root}foo/bar/baz`)).toBeFalsy()
    pattern = new Pattern(`${root}foo/b[!]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b!r`)
    expect(pattern.match(`${root}foo/b!r/baz`)).toBeTruthy()
    pattern = new Pattern(`${root}foo/b[[]ar/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b[ar`)
    expect(pattern.match(`${root}foo/b[ar/baz`)).toBeTruthy()
    pattern = new Pattern(`${root}foo/b[]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b[]r`)
    expect(pattern.match(`${root}foo/b[]r/baz`)).toBeTruthy()
    pattern = new Pattern(`${root}foo/b[r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b[r`)
    expect(pattern.match(`${root}foo/b[r/baz`)).toBeTruthy()
    pattern = new Pattern(`${root}foo/b]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo${path.sep}b]r`)
    expect(pattern.match(`${root}foo/b]r/baz`)).toBeTruthy()
    if (!IS_WINDOWS) {
      pattern = new Pattern('/foo/b\\[a]r/b*')
      expect(pattern.searchPath).toBe(`${path.sep}foo${path.sep}b[a]r`)
      expect(pattern.match('/foo/b[a]r/baz')).toBeTruthy()
      pattern = new Pattern('/foo/b[\\!]r/b*')
      expect(pattern.searchPath).toBe(`${path.sep}foo${path.sep}b!r`)
      expect(pattern.match('/foo/b!r/baz')).toBeTruthy()
      pattern = new Pattern('/foo/b[\\]]r/b*')
      expect(pattern.searchPath).toBe(`${path.sep}foo${path.sep}b]r`)
      expect(pattern.match('/foo/b]r/baz')).toBeTruthy()
      pattern = new Pattern('/foo/b[\\a]r/b*')
      expect(pattern.searchPath).toBe(`${path.sep}foo${path.sep}bar`)
      expect(pattern.match('/foo/bar/baz')).toBeTruthy()
    }

    // Negative
    pattern = new Pattern(`${root}foo/b[aA]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo`)
    pattern = new Pattern(`${root}foo/b[!a]r/b*`)
    expect(pattern.searchPath).toBe(`${root}foo`)
    if (IS_WINDOWS) {
      pattern = new Pattern('C:/foo/b\\[a]r/b*')
      expect(pattern.searchPath).toBe(`C:\\foo\\b\\ar`)
      expect(pattern.match('C:/foo/b/ar/baz')).toBeTruthy()
      pattern = new Pattern('C:/foo/b[\\!]r/b*')
      expect(pattern.searchPath).toBe('C:\\foo\\b[\\!]r')
      expect(pattern.match('C:/foo/b[undefined/!]r/baz')).toBeTruthy() // Note, "undefined" substr to accommodate a bug in Minimatch when nocase=true
    }
  })
})

function getTestTemp(): string {
  return path.join(__dirname, '_temp', 'internal-pattern')
}
