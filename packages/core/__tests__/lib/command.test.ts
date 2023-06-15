import type {SpyInstance} from 'vitest'

import os from 'node:os'
import process from 'node:process'

import {beforeEach, describe, expect, test, vi} from 'vitest'

import * as command from '../../src/lib/command.js'

describe('lib/command', () => {
  let stdOutSpy: SpyInstance<
    Parameters<typeof process.stdout.write>,
    ReturnType<typeof process.stdout.write>
  >

  // Assert that process.stdout.write calls called only with the given arguments.
  function assertWriteCalls(calls: string[]): void {
    expect(stdOutSpy).toHaveBeenCalledTimes(calls.length)

    for (const [i, call] of calls.entries()) {
      expect(stdOutSpy).toHaveBeenNthCalledWith(i + 1, call)
    }
  }

  beforeEach(() => {
    stdOutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  test('command only', () => {
    command.issueCommand('some-command', {}, '')
    assertWriteCalls([`::some-command::${os.EOL}`])
  })

  test('command escapes message', () => {
    // Verify replaces each instance, not just first instance
    command.issueCommand(
      'some-command',
      {},
      'percent % percent % cr \r cr \r lf \n lf \n'
    )
    assertWriteCalls([
      `::some-command::percent %25 percent %25 cr %0D cr %0D lf %0A lf %0A${os.EOL}`
    ])

    // Verify literal escape sequences
    stdOutSpy.mockClear()
    command.issueCommand('some-command', {}, '%25 %25 %0D %0D %0A %0A')
    assertWriteCalls([
      `::some-command::%2525 %2525 %250D %250D %250A %250A${os.EOL}`
    ])
  })

  test('command escapes property', () => {
    // Verify replaces each instance, not just first instance
    command.issueCommand(
      'some-command',
      {
        name: 'percent % percent % cr \r cr \r lf \n lf \n colon : colon : comma , comma ,'
      },
      ''
    )
    assertWriteCalls([
      `::some-command name=percent %25 percent %25 cr %0D cr %0D lf %0A lf %0A colon %3A colon %3A comma %2C comma %2C::${os.EOL}`
    ])

    // Verify literal escape sequences
    stdOutSpy.mockClear()
    command.issueCommand(
      'some-command',
      {},
      '%25 %25 %0D %0D %0A %0A %3A %3A %2C %2C'
    )
    assertWriteCalls([
      `::some-command::%2525 %2525 %250D %250D %250A %250A %253A %253A %252C %252C${os.EOL}`
    ])
  })

  test('command with message', () => {
    command.issueCommand('some-command', {}, 'some message')
    assertWriteCalls([`::some-command::some message${os.EOL}`])
  })

  test('command with message and properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2'},
      'some message'
    )
    assertWriteCalls([
      `::some-command prop1=value 1,prop2=value 2::some message${os.EOL}`
    ])
  })

  test('command with one property', () => {
    command.issueCommand('some-command', {prop1: 'value 1'}, '')
    assertWriteCalls([`::some-command prop1=value 1::${os.EOL}`])
  })

  test('command with two properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2'},
      ''
    )
    assertWriteCalls([`::some-command prop1=value 1,prop2=value 2::${os.EOL}`])
  })

  test('command with three properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2', prop3: 'value 3'},
      ''
    )
    assertWriteCalls([
      `::some-command prop1=value 1,prop2=value 2,prop3=value 3::${os.EOL}`
    ])
  })

  test('should handle issuing commands for non-string objects', () => {
    command.issueCommand(
      'some-command',
      {
        prop1: {test: 'object'} as unknown as string,
        prop2: 123 as unknown as string,
        prop3: true as unknown as string
      },
      {test: 'object'} as unknown as string
    )
    assertWriteCalls([
      `::some-command prop1={"test"%3A"object"},prop2=123,prop3=true::{"test":"object"}${os.EOL}`
    ])
  })
})
