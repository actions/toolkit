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
  success(message?: string): void {
    if (message) this.logger.success(message)
    exit.success()
  }

  /**
   * Stop the action with a "neutral" status.
   */
  neutral(message?: string): void {
    if (message) this.logger.info(message)
    exit.neutral()
  }

  /**
   * Stop the action with a "failed" status.
   */
  failure(message?: string): void {
    if (message) this.logger.fatal(message)
    exit.failure()
  }
}
