import {Signale} from 'signale'

/**
 * The code to exit an action
 */
export enum ExitCode {
  Success = 0,
  Failure = 1,
  Neutral = 78
}

// TODO: These exit codes may not behave as expected on the new runtime, due to
// complexities of async logging and sync exiting.

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
    process.exit(ExitCode.Success)
  }

  /**
   * Stop the action with a "neutral" status.
   */
  neutral(message?: string) {
    if (message) this.logger.info(message)
    process.exit(ExitCode.Neutral)
  }

  /**
   * Stop the action with a "failed" status.
   */
  failure(message?: string) {
    if (message) this.logger.fatal(message)
    process.exit(ExitCode.Failure)
  }
}
