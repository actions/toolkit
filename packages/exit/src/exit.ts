import * as tty from 'tty'

/**
 * Options for exiting an action
 */
export type ExitOpts = {
  /**
   * Exit immediately, without waiting for a drain
   */
  sync?: boolean
}

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
export async function success(opts: ExitOpts = {}) {
  await exit(ExitCode.Success, opts)
}

/**
 * Exit the action as a failure.
 */
export async function failure(opts: ExitOpts = {}) {
  await exit(ExitCode.Failure, opts)
}

/**
 * Exit the action neither a success or a failure
 */
export async function neutral(opts: ExitOpts = {}) {
  await exit(ExitCode.Neutral, opts)
}

/**
 * Exit after waiting for streams to drain (if needed).
 *
 * Since `process.exit` is synchronous, and writing to `process.stdout` and
 * `process.stderr` are potentially asynchronous, this function waits for them
 * to drain, if need be, before exiting.
 */
async function exit(code: ExitCode, opts: ExitOpts) {
  if (opts.sync) {
    process.exit(code)
  }

  const stdout = process.stdout as tty.WriteStream
  const stderr = process.stderr as tty.WriteStream

  await Promise.all([stdout, stderr].map(drainStream))

  process.exit(code)
}

/**
 * Drain the given `stream`, if need be, or immediately return.
 */
async function drainStream(stream: tty.WriteStream) {
  if (stream.bufferSize > 0) {
    return new Promise(resolve => stream.once('drain', resolve))
  } else {
    return Promise.resolve()
  }
}
