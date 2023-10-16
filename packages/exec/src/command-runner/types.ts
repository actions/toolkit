import * as exec from '../exec'
import {PromisifiedFn} from './utils'

/**
 * CommandRunner.prototype.run() outpout and context
 * that is passed to each middleware
 */
export interface CommandRunnerContext {
  /** Command that was executed */
  commandLine: string

  /** Arguments with which command was executed */
  args: string[]

  /** Command options with which command executor was ran */
  options: exec.ExecOptions

  /** Error that was thrown when attempting to execute command */
  execerr: Error | null

  /** Command's output that was passed to stderr if command did run, null otherwise */
  stderr: string | null

  /** Command's output that was passed to stdout if command did run, null otherwise */
  stdout: string | null

  /** Command's exit code if command did run, null otherwise */
  exitCode: number | null
}

/**
 * Base middleware shape
 */
type _CommandRunnerMiddleware = (
  ctx: CommandRunnerContext,
  next: () => Promise<void>
) => void | Promise<void>

/**
 * Normalized middleware shape that is always promisified
 */
export type CommandRunnerMiddleware = PromisifiedFn<_CommandRunnerMiddleware>

/**
 * Shape for the command runner default middleware creators
 */
export type CommandRunnerAction = (
  message?:
    | string
    | ((ctx: CommandRunnerContext, events: CommandRunnerEventType[]) => string)
) => PromisifiedFn<CommandRunnerMiddleware>

/**
 * Default middleware identifires that can be uset to set respective action
 * in copmposing middleware
 */
export type CommandRunnerActionType = 'throw' | 'fail' | 'log'

/**
 * Command runner event types on which middleware can be set
 */
export type CommandRunnerEventType =
  | 'execerr'
  | 'stderr'
  | 'stdout'
  | 'exitcode'
  | 'ok'

/**
 * Extended event type that can be used to set middleware on event not happening
 */
export type CommandRunnerEventTypeExtended =
  | CommandRunnerEventType
  | `!${CommandRunnerEventType}`

/**
 * options that would be passed to the command executor (exec.exec by default)
 * failOnStdErr and ignoreReturnCode are excluded as they are
 * handled by the CommandRunner itself
 */
export type CommandRunnerOptions = Omit<
  exec.ExecOptions,
  'failOnStdErr' | 'ignoreReturnCode'
>
