import * as exit from '@actions/exit'
import {Signale} from 'signale'

/**
 * A class that wraps some basic methods of exiting from an action
 *
 * ```typescript
 * const exit = new Exit(signaleLogger)
 * exit.success('Success!', {sync: true})
 * ```
 */
export class Exit {
  /**
   * Create a new [[Exit]] instance.
   *
   * @param logger An instance of [Signale](https://github.com/klaussinani/signale) to write to
   */
  constructor(private readonly logger: Signale) {}

  /**
   * Stop the action with a "success" status.
   *
   * @param message The message to log when exiting
   * @param opts [[ExitOpts]] to use for the exit
   */
  success(message?: string, opts?: exit.ExitOpts) {
    if (message) this.logger.success(message)
    return exit.success(opts)
  }

  /**
   * Stop the action with a "neutral" status.
   *
   * @param message The message to log when exiting
   * @param opts [[ExitOpts]] to use for the exit
   */
  neutral(message?: string, opts?: exit.ExitOpts) {
    if (message) this.logger.info(message)
    return exit.neutral(opts)
  }

  /**
   * Stop the action with a "failed" status.
   *
   * @param message The message to log when exiting
   * @param opts [[ExitOpts]] to use for the exit
   */
  failure(message?: string, opts?: exit.ExitOpts) {
    if (message) this.logger.fatal(message)
    return exit.failure(opts)
  }
}
