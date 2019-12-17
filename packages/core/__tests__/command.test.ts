import * as command from '../src/command'
import * as os from 'os'

/* eslint-disable @typescript-eslint/unbound-method */

let originalWriteFunction: (str: string) => boolean

describe('@actions/core/src/command', () => {
  beforeAll(() => {
    originalWriteFunction = process.stdout.write
  })

  beforeEach(() => {
    process.stdout.write = jest.fn()
  })

  afterEach(() => {})

  afterAll(() => {
    process.stdout.write = (originalWriteFunction as unknown) as (
      str: string
    ) => boolean
  })

  it('command only', () => {
    command.issueCommand('some-command', {}, '')
    assertWriteCalls([`::some-command::${os.EOL}`])
  })

  it('command with message', () => {
    command.issueCommand('some-command', {}, 'some message')
    assertWriteCalls([`::some-command::some message${os.EOL}`])
  })

  it('command with message and properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2'},
      'some message'
    )
    assertWriteCalls([
      `::some-command prop1=value 1,prop2=value 2::some message${os.EOL}`
    ])
  })

  it('command with one property', () => {
    command.issueCommand('some-command', {prop1: 'value 1'}, '')
    assertWriteCalls([`::some-command prop1=value 1::${os.EOL}`])
  })

  it('command with two properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2'},
      ''
    )
    assertWriteCalls([`::some-command prop1=value 1,prop2=value 2::${os.EOL}`])
  })

  it('command with three properties', () => {
    command.issueCommand(
      'some-command',
      {prop1: 'value 1', prop2: 'value 2', prop3: 'value 3'},
      ''
    )
    assertWriteCalls([
      `::some-command prop1=value 1,prop2=value 2,prop3=value 3::${os.EOL}`
    ])
  })
})

// Assert that process.stdout.write calls called only with the given arguments.
function assertWriteCalls(calls: string[]): void {
  expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

  for (let i = 0; i < calls.length; i++) {
    expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i])
  }
}
