import * as exitPkg from '@actions/exit'
import {Signale} from 'signale'
import {Exit} from '../src/exit'

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('@actions/exit')

const tests: [keyof Exit, keyof Signale][] = [
  ['success', 'success'],
  ['neutral', 'info'],
  ['failure', 'fatal']
]

describe.each(tests)('%s', (method, log) => {
  let logger: Signale
  let exit: Exit

  beforeEach(() => {
    // Create a logger to mock
    logger = new Signale()
    logger.success = jest.fn()
    logger.info = jest.fn()
    logger.fatal = jest.fn()

    process.exit = jest.fn<never, [number]>()
    exit = new Exit(logger)
  })

  it('exits with the expected method', () => {
    exit[method]()
    expect(exitPkg[method]).toHaveBeenCalled()
  })

  it('logs the expected message', () => {
    exit[method]('hello')
    expect(logger[log]).toHaveBeenCalledWith('hello')
  })
})
