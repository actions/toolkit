import type {SpyInstance} from 'vitest'

import os from 'node:os'

import {beforeEach, describe, expect, test, vi} from 'vitest'

import * as logging from '../src/logging.js'

describe('logging', () => {
  let stdOutSpy: SpyInstance<
    Parameters<typeof process.stdout.write>,
    ReturnType<typeof process.stdout.write>
  >

  function assertWriteCalls(calls: string[]): void {
    expect(stdOutSpy).toHaveBeenCalledTimes(calls.length)

    for (const [i, call] of calls.entries()) {
      expect(stdOutSpy).toHaveBeenNthCalledWith(i + 1, call)
    }
  }

  beforeEach(() => {
    stdOutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  describe('warning', () => {
    test('warning sets the correct message', () => {
      logging.warning('Warning')
      assertWriteCalls([`::warning::Warning${os.EOL}`])
    })

    test('warning escapes the message', () => {
      logging.warning('\r\nwarning\n')
      assertWriteCalls([`::warning::%0D%0Awarning%0A${os.EOL}`])
    })

    test('warning handles an error object', () => {
      const message = 'this is my error message'
      logging.warning(new Error(message))
      assertWriteCalls([`::warning::Error: ${message}${os.EOL}`])
    })

    test('warning handles parameters correctly', () => {
      const message = 'this is my error message'
      logging.warning(new Error(message), {
        title: 'A title',
        file: 'root/test.txt',
        startColumn: 1,
        endColumn: 2,
        startLine: 5,
        endLine: 5
      })
      assertWriteCalls([
        `::warning title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
      ])
    })
  })

  describe('notice', () => {
    test('notice sets the correct message', () => {
      logging.notice('Notice')
      assertWriteCalls([`::notice::Notice${os.EOL}`])
    })

    test('notice escapes the message', () => {
      logging.notice('\r\nnotice\n')
      assertWriteCalls([`::notice::%0D%0Anotice%0A${os.EOL}`])
    })

    test('notice handles an error object', () => {
      const message = 'this is my error message'
      logging.notice(new Error(message))
      assertWriteCalls([`::notice::Error: ${message}${os.EOL}`])
    })

    test('notice handles parameters correctly', () => {
      const message = 'this is my error message'
      logging.notice(new Error(message), {
        title: 'A title',
        file: 'root/test.txt',
        startColumn: 1,
        endColumn: 2,
        startLine: 5,
        endLine: 5
      })
      assertWriteCalls([
        `::notice title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
      ])
    })
  })

  describe('startGroup', () => {
    test('starts a new group', () => {
      logging.startGroup('my-group')
      assertWriteCalls([`::group::my-group${os.EOL}`])
    })
  })

  describe('endGroup', () => {
    test('ends new group', () => {
      logging.endGroup()
      assertWriteCalls([`::endgroup::${os.EOL}`])
    })
  })

  describe('group', () => {
    test('wraps an async call in a group', async () => {
      const result = await logging.group('mygroup', async () => {
        process.stdout.write('in my group\n')
        return true
      })
      expect(result).toBe(true)
      assertWriteCalls([
        `::group::mygroup${os.EOL}`,
        'in my group\n',
        `::endgroup::${os.EOL}`
      ])
    })
  })

  describe('debug', () => {
    test('sets the correct message', () => {
      logging.debug('Debug')
      assertWriteCalls([`::debug::Debug${os.EOL}`])
    })

    test(' escapes the message', () => {
      logging.debug('\r\ndebug\n')
      assertWriteCalls([`::debug::%0D%0Adebug%0A${os.EOL}`])
    })
  })

  describe('isDebug', () => {
    test('check debug state', () => {
      const current = process.env['RUNNER_DEBUG']
      try {
        delete process.env['RUNNER_DEBUG']
        expect(logging.isDebug()).toBe(false)

        process.env['RUNNER_DEBUG'] = '1'
        expect(logging.isDebug()).toBe(true)
      } finally {
        process.env['RUNNER_DEBUG'] = current
      }
    })
  })
})
