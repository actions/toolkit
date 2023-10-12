import * as exec from '@actions/exec'

/* CommandRunner core */

export interface CommandRunnerContext {
  /* Inputs with which command was executed */
  commandLine: string
  args: string[]
  options: exec.ExecOptions

  /* Results of the execution */
  execerr: Error | null
  stderr: string | null
  stdout: string | null
  exitCode: number | null
}

/* Middlewares as used internally in CommandRunner */
export type CommandRunnerMiddlewarePromisified = (
  ctx: CommandRunnerContext,
  next: () => Promise<void>
) => Promise<void>

/* Middlewares as used by the user */
export type CommandRunnerMiddleware = (
  ctx: CommandRunnerContext,
  next: () => Promise<void>
) => void | Promise<void>

/* Command runner events handling and command runner actions */

/* Command runner default actions types on which preset middleware exists */
export type CommandRunnerActionType = 'throw' | 'fail' | 'log'

/* Command runner event types as used internally passed to middleware for the user */
export type CommandRunnerEventType =
  | 'execerr'
  | 'stderr'
  | 'stdout'
  | 'exitcode'
  | 'ok'

/* Command runner event types as used by the user for filtering results */
export type CommandRunnerEventTypeExtended =
  | CommandRunnerEventType
  | `!${CommandRunnerEventType}`

export type CommandRunnerOptions = Omit<
  exec.ExecOptions,
  'failOnStdErr' | 'ignoreReturnCode'
>
