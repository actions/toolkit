import type {SpyInstance} from 'vitest'

import os from 'node:os'

import {beforeEach, describe, expect, test, vi} from 'vitest'

import * as errors from '../src/errors.js'
import {ExitCode} from '../src/types.js'

describe('errors', () => {
  let stdOutSpy: SpyInstance<
    Parameters<typeof process.stdout.write>,
    ReturnType<typeof process.stdout.write>
  >

  beforeEach(() => {
    stdOutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  function assertWriteCalls(calls: string[]): void {
    expect(stdOutSpy).toHaveBeenCalledTimes(calls.length)

    for (const [i, call] of calls.entries()) {
      expect(stdOutSpy).toHaveBeenNthCalledWith(i + 1, call)
    }
  }

  describe('setFailed', () => {
    test('setFailed sets the correct exit code and failure message', () => {
      errors.setFailed('Failure message')

      expect(process.exitCode).toBe(ExitCode.Failure)
      assertWriteCalls([`::error::Failure message${os.EOL}`])
    })

    test('setFailed escapes the failure message', () => {
      errors.setFailed('Failure \r\n\nmessage\r')

      expect(process.exitCode).toBe(ExitCode.Failure)
      assertWriteCalls([`::error::Failure %0D%0A%0Amessage%0D${os.EOL}`])
    })

    test('setFailed handles Error', () => {
      const message = 'this is my error message'
      errors.setFailed(new Error(message))

      expect(process.exitCode).toBe(ExitCode.Failure)
      assertWriteCalls([`::error::Error: ${message}${os.EOL}`])
    })
  })

  describe('error', () => {
    test('error sets the correct error message', () => {
      errors.error('Error message')
      assertWriteCalls([`::error::Error message${os.EOL}`])
    })

    test('error escapes the error message', () => {
      errors.error('Error message\r\n\n')
      assertWriteCalls([`::error::Error message%0D%0A%0A${os.EOL}`])
    })

    test('error handles an error object', () => {
      const message = 'this is my error message'
      errors.error(new Error(message))
      assertWriteCalls([`::error::Error: ${message}${os.EOL}`])
    })

    test('error handles parameters correctly', () => {
      const message = 'this is my error message'
      errors.error(new Error(message), {
        title: 'A title',
        file: 'root/test.txt',
        startColumn: 1,
        endColumn: 2,
        startLine: 5,
        endLine: 5
      })
      assertWriteCalls([
        `::error title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
      ])
    })
  })
})
