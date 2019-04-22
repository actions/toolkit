import {LoggerFunc, Signale} from 'signale'
import {Exit} from './exit'

export type ActionFn = (tools: Toolkit) => unknown

/**
 * Options used to customize an instance of [[Toolkit]]
 */
export type ToolkitOptions = {
  /**
   * A custom Signale instance to use
   */
  logger?: Signale

  /**
   * A list of environment variable names this action requires in order to run
   *
   * If any of them are missing, the action will fail and log the missing keys.
   */
  requiredEnv?: string[]
}

/**
 * A set of tools for the Actions runtime
 */
export class Toolkit {
  /**
   * Run an asynchronous function that accepts a toolkit as its argument.
   *
   * If an error occurs, the error will be logged and the action will exit as a
   * failure.
   *
   * ```typescript
   * Toolkit.run(async toolkit => {
   *   toolkit.logger('Hello, world!')
   *   await toolkit.exit.success()
   * })
   * ```
   *
   * @param func The function to run
   * @param opts [[ToolkitOptions]] with which to run the function
   */
  static async run(func: ActionFn, opts?: ToolkitOptions) {
    const tools = new Toolkit(opts)

    try {
      const ret = func(tools)
      return ret instanceof Promise ? await ret : ret
    } catch (err) {
      await tools.exit.failure(err)
    }
  }

  /**
   * A logger for the toolkit, an instance of [Signale](https://github.com/klaussinani/signale)
   */
  readonly logger: Signale & LoggerFunc

  /**
   * A wrapper around an instance of [[Exit]]
   */
  readonly exit: Exit

  /**
   * The authentication token for the GitHub API
   */
  readonly token: string = process.env.GITHUB_TOKEN || ''

  /**
   * Create an instance of [[Toolkit]].
   *
   * @param opts [[ToolkitOptions]] for configuring the [[Toolkit]]
   */
  constructor(opts: ToolkitOptions = {}) {
    const logger = opts.logger || new Signale({config: {underlineLabel: false}})
    this.logger = this.wrapLogger(logger)
    this.exit = new Exit(this.logger)

    if (opts.requiredEnv) {
      this.checkRequiredEnv(opts.requiredEnv)
    }
  }

  /**
   * Ensure that the given keys are in the environment.
   *
   * @param keys A list of keys to be ensured are in the environment
   */
  private checkRequiredEnv(keys: string[]) {
    const missingEnv = keys.filter(key => !process.env.hasOwnProperty(key))

    if (missingEnv.length === 0) return

    const list = missingEnv.map(key => `- ${key}`).join('\n')

    this.exit.failure(
      `The following environment variables are required for this action to run:\n${list}`,
      {sync: true}
    )
  }

  /**
   * Wrap a Signale logger so that its a callable class.
   *
   * @param logger A logger to wrap (and make callable)
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
