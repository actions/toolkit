import * as exitPkg from '@actions/exit'
import {Signale} from 'signale'
import {Toolkit} from '../src/toolkit'

jest.mock('@actions/exit')

describe('.run', () => {
  it('runs a sync function', async () => {
    const cb = jest.fn(() => true)
    const value = await Toolkit.run(cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Toolkit))
    expect(value).toBe(true)
  })

  it('runs an async function', async () => {
    const cb = jest.fn(async () => true)
    const value = await Toolkit.run(cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Toolkit))
    expect(value).toBe(true)
  })

  it('logs and fails when an error occurs', async () => {
    const err = new Error('Error in run')

    const logFatal = jest.fn()

    await Toolkit.run(async tk => {
      tk.logger.fatal = logFatal
      throw err
    })

    expect(logFatal).toHaveBeenCalledWith(err)
    expect(exitPkg.failure).toHaveBeenCalled()
  })
})

it('asserts required keys are present', async () => {
  const missingKey = '__DOES_NOT_EXIST__'

  Reflect.deleteProperty(process.env, missingKey)

  const logger = new Signale()
  logger.fatal = jest.fn()
  jest.spyOn(process, 'exit').mockImplementation()

  new Toolkit({logger, requiredEnv: [missingKey]})

  expect(exitPkg.failure).toHaveBeenCalledWith({sync: true})
  expect(logger.fatal)
    .toHaveBeenCalledWith(`The following environment variables are required for this action to run:
- __DOES_NOT_EXIST__`)
})
