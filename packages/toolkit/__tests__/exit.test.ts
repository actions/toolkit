import {Signale} from 'signale'
import {Exit, ExitCode} from '../src/exit'

describe('Exit', () => {
  const tests: [keyof Exit, keyof Signale, ExitCode][] = [
    ['success', 'success', ExitCode.Success],
    ['neutral', 'info', ExitCode.Neutral],
    ['failure', 'fatal', ExitCode.Failure]
  ]

  describe.each(tests)('%s', (method, log, code) => {
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

    it('exits with the expected code', () => {
      exit[method]()
      expect(process.exit).toHaveBeenCalledWith(code)
    })

    it('logs the expected message', () => {
      exit[method]('hello')
      expect(logger[log]).toHaveBeenCalledWith('hello')
    })
  })
})
