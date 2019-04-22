import * as exit from '@actions/exit'
import {Signale} from 'signale'

/**
 * A class that wraps some basic methods of exiting from an action
 */
export class Exit {
  constructor(private readonly logger: Signale) {}

  /**
   * Stop the action with a "success" status.
   */
  success(message?: string) {
    if (message) this.logger.success(message)
    return exit.success()
  }

  /**
   * Stop the action with a "neutral" status.
   */
  neutral(message?: string) {
    if (message) this.logger.info(message)
    return exit.neutral()
  }

  /**
   * Stop the action with a "failed" status.
   */
  failure(message?: string, opts?: exit.ExitOpts) {
    if (message) this.logger.fatal(message)
    return exit.failure(opts)
  }
}
