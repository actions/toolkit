import * as path from 'path'
import {Path} from '../src/internal-path'

const IS_WINDOWS = process.platform === 'win32'

describe('path', () => {
  it('constructs from rooted path', () => {
    assertPath(`/`, `${path.sep}`, [path.sep])
    assertPath(`/foo`, `${path.sep}foo`, [path.sep, 'foo'])
    if (IS_WINDOWS) {
      assertPath(`C:\\foo`, `C:\\foo`, ['C:\\', 'foo'])
      assertPath(`C:foo`, `C:foo`, ['C:', 'foo'])
      assertPath(`\\\\foo\\bar\\baz`, `\\\\foo\\bar\\baz`, [
        '\\\\foo\\bar',
        'baz'
      ])
    }
  })

  it('constructs from rooted segments', () => {
    assertPath([`/`], `${path.sep}`, [path.sep])
    assertPath([`/`, `foo`], `${path.sep}foo`, [path.sep, 'foo'])
    if (IS_WINDOWS) {
      assertPath([`C:\\`, `foo`], `C:\\foo`, ['C:\\', 'foo'])
      assertPath([`C:`, `foo`], `C:foo`, ['C:', 'foo'])
      assertPath([`\\\\foo\\bar`, `baz`], `\\\\foo\\bar\\baz`, [
        '\\\\foo\\bar',
        'baz'
      ])
    }
  })

  it('constructs from relative path', () => {
    assertPath(`foo`, `foo`, ['foo'])
    assertPath(`foo/bar`, `foo${path.sep}bar`, ['foo', 'bar'])
  })

  it('constructs from relative segments', () => {
    assertPath([`foo`], `foo`, ['foo'])
    assertPath([`foo`, `bar`], `foo${path.sep}bar`, ['foo', 'bar'])
  })

  it('normalizes slashes', () => {
    assertPath(
      `/foo///bar${path.sep}${path.sep}${path.sep}baz`,
      `${path.sep}foo${path.sep}bar${path.sep}baz`,
      [path.sep, 'foo', 'bar', 'baz']
    )
  })

  it('preserves relative pathing', () => {
    assertPath(
      '/foo/../bar/./baz',
      `${path.sep}foo${path.sep}..${path.sep}bar${path.sep}.${path.sep}baz`,
      [path.sep, 'foo', '..', 'bar', '.', 'baz']
    )
  })

  it('trims unnecessary trailing slash', () => {
    assertPath('/', path.sep, [path.sep])
    assertPath('/foo/', `${path.sep}foo`, [path.sep, 'foo'])
    assertPath('foo/', 'foo', ['foo'])
    assertPath('foo/bar/', `foo${path.sep}bar`, ['foo', 'bar'])
    if (IS_WINDOWS) {
      assertPath('\\', '\\', ['\\'])
      assertPath('C:\\', 'C:\\', ['C:\\'])
      assertPath('C:\\foo\\', 'C:\\foo', ['C:\\', 'foo'])
      assertPath('C:foo\\', 'C:foo', ['C:', 'foo'])
      assertPath('\\\\computer\\share\\', '\\\\computer\\share', [
        '\\\\computer\\share'
      ])
      assertPath('\\\\computer\\share\\foo', '\\\\computer\\share\\foo', [
        '\\\\computer\\share',
        'foo'
      ])
      assertPath('\\\\computer\\share\\foo\\', '\\\\computer\\share\\foo', [
        '\\\\computer\\share',
        'foo'
      ])
    }
  })
})

function assertPath(
  itemPath: string | string[],
  expectedPath: string,
  expectedSegments: string[]
): void {
  const actual = new Path(itemPath)
  expect(actual.toString()).toBe(expectedPath)
  expect(actual.segments).toEqual(expectedSegments)
}
