import * as path from 'path'

import {toPlatformPath, toPosixPath, toWin32Path} from '../src/path-utils'

describe('#toPosixPath', () => {
  const cases: {
    only?: boolean
    name: string
    input: string
    expected: string
  }[] = [
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
  ]

  for (const tc of cases) {
    const fn = tc.only ? it.only : it
    fn(tc.name, () => {
      const result = toPosixPath(tc.input)
      expect(result).toEqual(tc.expected)
    })
  }
})

describe('#toWin32Path', () => {
  const cases: {
    only?: boolean
    name: string
    input: string
    expected: string
  }[] = [
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
  ]

  for (const tc of cases) {
    const fn = tc.only ? it.only : it
    fn(tc.name, () => {
      const result = toWin32Path(tc.input)
      expect(result).toEqual(tc.expected)
    })
  }
})

describe('#toPlatformPath', () => {
  const cases: {
    only?: boolean
    name: string
    input: string
    expected: string
  }[] = [
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
  ]

  for (const tc of cases) {
    const fn = tc.only ? it.only : it
    fn(tc.name, () => {
      const result = toPlatformPath(tc.input)
      expect(result).toEqual(tc.expected)
    })
  }
})
