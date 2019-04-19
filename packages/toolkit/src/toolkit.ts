import {LoggerFunc, Signale} from 'signale'
import {Exit} from './exit'

export type ActionFn = (tools: Toolkit) => unknown

/**
 * A set of tools for the Actions runtime
 */
export class Toolkit {
  /**
   * Run an asynchronous function that accepts a toolkit as its argument.
   *
   * If an error occurs, the error will be logged and the action will exit as a
   * failure.
   */
  static async run(func: ActionFn) {
    const tools = new Toolkit()

    try {
      const ret = func(tools)
      return ret instanceof Promise ? await ret : ret
    } catch (err) {
      tools.exit.failure(err)
    }
  }

  /**
   * A logger for the toolkit, an instance of [Signale](https://github.com/klaussinani/signale)
   */
  readonly logger: Signale & LoggerFunc = this.wrapLogger(
    new Signale({
      config: {
        underlineLabel: false
      }
    })
  )

  /**
   * A wrapper around an instance of [[Exit]]
   */
  readonly exit: Exit = new Exit(this.logger)

  /**
   * Wrap a Signale logger so that its a callable class
   */
  private wrapLogger(logger: Signale) {
    // Create a callable function
    const fn = logger.info.bind(logger)
    // Add the log methods onto the function
    const wrapped = Object.assign(fn, logger)
    // Clone the prototype
    Object.setPrototypeOf(wrapped, logger)
    return wrapped
  }
}
