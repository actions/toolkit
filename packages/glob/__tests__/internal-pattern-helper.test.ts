import * as path from 'path'
import * as patternHelper from '../src/internal-pattern-helper'
import {MatchKind} from '../src/internal-match-kind'
import {IS_WINDOWS} from '../../io/src/io-util'
import {Pattern} from '../src/internal-pattern'

describe('pattern-helper', () => {
  it('getSearchPaths omits negate search paths', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const patterns = [
      `${root}search1/foo/**`,
      `${root}search2/bar/**`,
      `!${root}search3/baz/**`
    ].map(x => new Pattern(x))
    const searchPaths = patternHelper.getSearchPaths(patterns)
    expect(searchPaths).toEqual([
      `${root}search1${path.sep}foo`,
      `${root}search2${path.sep}bar`
    ])
  })

  it('getSearchPaths omits search path when ancestor is also a search path', () => {
    if (IS_WINDOWS) {
      const patterns = [
        'C:\\Search1\\Foo\\**',
        'C:\\sEARCH1\\fOO\\bar\\**',
        'C:\\sEARCH1\\foo\\bar',
        'C:\\Search2\\**',
        'C:\\Search3\\Foo\\Bar\\**',
        'C:\\sEARCH3\\fOO\\bAR\\**'
      ].map(x => new Pattern(x))
      const searchPaths = patternHelper.getSearchPaths(patterns)
      expect(searchPaths).toEqual([
        'C:\\Search1\\Foo',
        'C:\\Search2',
        'C:\\Search3\\Foo\\Bar'
      ])
    } else {
      const patterns = [
        '/search1/foo/**',
        '/search1/foo/bar/**',
        '/search2/foo/bar',
        '/search2/**',
        '/search3/foo/bar/**',
        '/search3/foo/bar/**'
      ].map(x => new Pattern(x))

      const searchPaths = patternHelper.getSearchPaths(patterns)
      expect(searchPaths).toEqual([
        '/search1/foo',
        '/search2',
        '/search3/foo/bar'
      ])
    }
  })

  it('match supports interleaved exclude patterns', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const itemPaths = [
      `${root}solution1/proj1/proj1.proj`,
      `${root}solution1/proj1/README.txt`,
      `${root}solution1/proj2/proj2.proj`,
      `${root}solution1/proj2/README.txt`,
      `${root}solution1/solution1.sln`,
      `${root}solution2/proj1/proj1.proj`,
      `${root}solution2/proj1/README.txt`,
      `${root}solution2/proj2/proj2.proj`,
      `${root}solution2/proj2/README.txt`,
      `${root}solution2/solution2.sln`
    ]
    const patterns = [
      `${root}**/*.proj`, // include all proj files
      `${root}**/README.txt`, // include all README files
      `!${root}**/solution2/**`, // exclude the solution 2 folder entirely
      `${root}**/*.sln`, // include all sln files
      `!${root}**/proj2/README.txt` // exclude proj2 README files
    ].map(x => new Pattern(x))
    const matched = itemPaths.filter(
      x => patternHelper.match(patterns, x) === MatchKind.All
    )
    expect(matched).toEqual([
      `${root}solution1/proj1/proj1.proj`,
      `${root}solution1/proj1/README.txt`,
      `${root}solution1/proj2/proj2.proj`,
      `${root}solution1/solution1.sln`,
      `${root}solution2/solution2.sln`
    ])
  })

  it('match supports excluding directories', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const itemPaths = [
      root,
      `${root}foo`,
      `${root}foo/bar`,
      `${root}foo/bar/baz`
    ]
    const patterns = [
      `${root}foo/**`, // include all files and directories
      `!${root}foo/**/` // exclude directories
    ].map(x => new Pattern(x))
    const matchKinds = itemPaths.map(x => patternHelper.match(patterns, x))
    expect(matchKinds).toEqual([
      MatchKind.None,
      MatchKind.File,
      MatchKind.File,
      MatchKind.File
    ])
  })

  it('match supports including directories only', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const itemPaths = [
      root,
      `${root}foo/`,
      `${root}foo/bar`,
      `${root}foo/bar/baz`
    ]
    const patterns = [
      `${root}foo/**/` // include directories only
    ].map(x => new Pattern(x))
    const matchKinds = itemPaths.map(x => patternHelper.match(patterns, x))
    expect(matchKinds).toEqual([
      MatchKind.None,
      MatchKind.Directory,
      MatchKind.Directory,
      MatchKind.Directory
    ])
  })

  it('partialMatch skips negate patterns', () => {
    const root = IS_WINDOWS ? 'C:\\' : '/'
    const patterns = [
      `${root}search1/foo/**`,
      `${root}search2/bar/**`,
      `!${root}search2/bar/**`,
      `!${root}search3/baz/**`
    ].map(x => new Pattern(x))
    expect(patternHelper.partialMatch(patterns, `${root}search1`)).toBeTruthy()
    expect(
      patternHelper.partialMatch(patterns, `${root}search1/foo`)
    ).toBeTruthy()
    expect(patternHelper.partialMatch(patterns, `${root}search2`)).toBeTruthy()
    expect(
      patternHelper.partialMatch(patterns, `${root}search2/bar`)
    ).toBeTruthy()
    expect(patternHelper.partialMatch(patterns, `${root}search3`)).toBeFalsy()
    expect(
      patternHelper.partialMatch(patterns, `${root}search3/bar`)
    ).toBeFalsy()
  })
})
