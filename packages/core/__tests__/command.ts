import * as command from '../src/command'
import * as os from 'os'
import * as path from 'path'

let originalWriteFunction

describe('@actions/core/src/command', () => {
  beforeAll(() => {
    originalWriteFunction = process.stdout.write
  })

  beforeEach(() => {
    process.stdout.write = jest.fn()
  })

  afterEach(() => {
  })

  afterAll(() => {
    process.stdout.write = originalWriteFunction
  })

  it('command asdf', () => {
  })
})

// Assert that process.stdout.write calls called only with the given arguments.
function assertWriteCalls(calls: string[]): void {
  expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

  for (let i = 0; i < calls.length; i++) {
    expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i])
  }
}
