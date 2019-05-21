/**
 * The code to exit an action
 */
export enum ExitCode {
  /**
   * A code indicating that the action was successful
   */
  Success = 0,

  /**
   * A code indicating that the action was a failure
   */
  Failure = 1,

  /**
   * A code indicating that the action is complete, but neither succeeded nor failed
   */
  Neutral = 78
}

// TODO: These exit codes may not behave as expected on the new runtime, due to
// complexities of async logging and sync exiting.

/**
 * Exit the action as a success.
 */
export function success(): void {
  process.exit(ExitCode.Success)
}

/**
 * Exit the action as a failure.
 */
export function failure(): void {
  process.exit(ExitCode.Failure)
}

/**
 * Exit the action neither a success or a failure
 */
export function neutral(): void {
  process.exit(ExitCode.Neutral)
}
