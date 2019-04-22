import {WriteStream} from 'tty'

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

async function exit(code: ExitCode, opts: ExitOpts) {
  if (opts.sync) {
    process.exit(code)
  }

  const stdout = process.stdout as WriteStream
  const stderr = process.stderr as WriteStream

  await Promise.all([stdout, stderr].map(drainStream))

  process.exit(code)
}

async function drainStream(stream: WriteStream) {
  if (stream.bufferSize > 0) {
    return new Promise(resolve => stream.once('drain', resolve))
  } else {
    return Promise.resolve()
  }
}
