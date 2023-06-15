import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {
  toPlatformPath,
  toPosixPath,
  toWin32Path
} from '../../src/lib/path-utils.js'

type Items = {only?: boolean; name: string; input: string; expected: string}

describe.each<Items>([
  {
    name: 'empty string',
    input: '',
    expected: ''
  },
  {
    name: 'single value',
    input: 'foo',
    expected: 'foo'
  },
  {
    name: 'with posix relative',
    input: 'foo/bar/baz',
    expected: 'foo/bar/baz'
  },
  {
    name: 'with posix absolute',
    input: '/foo/bar/baz',
    expected: '/foo/bar/baz'
  },
  {
    name: 'with win32 relative',
    input: 'foo\\bar\\baz',
    expected: 'foo/bar/baz'
  },
  {
    name: 'with win32 absolute',
    input: '\\foo\\bar\\baz',
    expected: '/foo/bar/baz'
  },
  {
    name: 'with a mix',
    input: '\\foo/bar/baz',
    expected: '/foo/bar/baz'
  }
])('toPosixPath', ({name, input, expected}) => {
  test(`${name}`, () => {
    const result = toPosixPath(input)
    expect(result).toStrictEqual(expected)
  })
})

describe.each<Items>([
  {
    name: 'empty string',
    input: '',
    expected: ''
  },
  {
    name: 'single value',
    input: 'foo',
    expected: 'foo'
  },
  {
    name: 'with posix relative',
    input: 'foo/bar/baz',
    expected: 'foo\\bar\\baz'
  },
  {
    name: 'with posix absolute',
    input: '/foo/bar/baz',
    expected: '\\foo\\bar\\baz'
  },
  {
    name: 'with win32 relative',
    input: 'foo\\bar\\baz',
    expected: 'foo\\bar\\baz'
  },
  {
    name: 'with win32 absolute',
    input: '\\foo\\bar\\baz',
    expected: '\\foo\\bar\\baz'
  },
  {
    name: 'with a mix',
    input: '\\foo/bar\\baz',
    expected: '\\foo\\bar\\baz'
  }
])('toWin32Path', ({name, input, expected}) => {
  test(`${name}`, () => {
    const result = toWin32Path(input)
    expect(result).toStrictEqual(expected)
  })
})

describe.each<Items>([
  {
    name: 'empty string',
    input: '',
    expected: ''
  },
  {
    name: 'single value',
    input: 'foo',
    expected: 'foo'
  },
  {
    name: 'with posix relative',
    input: 'foo/bar/baz',
    expected: path.join('foo', 'bar', 'baz')
  },
  {
    name: 'with posix absolute',
    input: '/foo/bar/baz',
    expected: path.join(path.sep, 'foo', 'bar', 'baz')
  },
  {
    name: 'with win32 relative',
    input: 'foo\\bar\\baz',
    expected: path.join('foo', 'bar', 'baz')
  },
  {
    name: 'with win32 absolute',
    input: '\\foo\\bar\\baz',
    expected: path.join(path.sep, 'foo', 'bar', 'baz')
  },
  {
    name: 'with a mix',
    input: '\\foo/bar\\baz',
    expected: path.join(path.sep, 'foo', 'bar', 'baz')
  }
])('#toPlatformPath', ({name, input, expected}) => {
  test(`${name}`, () => {
    const result = toPlatformPath(input)
    expect(result).toStrictEqual(expected)
  })
})
