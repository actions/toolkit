import * as exec from '@actions/exec'
import {PromisifiedFn} from './utils'

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

/* Middlewares as used by the user */
type _CommandRunnerMiddleware = (
  ctx: CommandRunnerContext,
  next: () => Promise<void>
) => void | Promise<void>

export type CommandRunnerMiddleware = PromisifiedFn<_CommandRunnerMiddleware>

/* Command runner events handling and command runner actions */

export type CommandRunnerAction = (
  message?:
    | string
    | ((ctx: CommandRunnerContext, events: CommandRunnerEventType[]) => string)
) => PromisifiedFn<CommandRunnerMiddleware>

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

/* Matchers */

export type OutputMatcher = RegExp | string | ((output: string) => boolean)

export type ExitCodeMatcher = string | number

export type ErrorMatcher =
  | RegExp
  | string
  | ((error: {
      type: 'stderr' | 'execerr'
      error: Error | null
      message: string
    }) => boolean)
