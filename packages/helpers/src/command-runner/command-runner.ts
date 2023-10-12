import * as exec from '@actions/exec'
import {CommandRunnerBase} from './core'
import {
  failAction,
  matchEvent,
  matchExitCode,
  matchOutput,
  matchSpecificError,
  produceLog,
  throwError
} from './middleware'
import {
  CommandRunnerActionType,
  CommandRunnerEventTypeExtended,
  CommandRunnerMiddleware,
  CommandRunnerOptions,
  ErrorMatcher,
  ExitCodeMatcher,
  OutputMatcher
} from './types'

const commandRunnerActions = {
  throw: throwError,
  fail: failAction,
  log: produceLog
} as const

export class CommandRunner extends CommandRunnerBase {
  on(
    event: CommandRunnerEventTypeExtended | CommandRunnerEventTypeExtended[],
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchEvent(event, middleware))
    return this
  }

  onEmptyOutput(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    this.onOutput(stdout => stdout?.trim() === '', action, message)
    return this
  }

  onExecutionError(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchSpecificError(({type}) => type === 'execerr', middleware))

    return this
  }

  onStdError(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchSpecificError(({type}) => type === 'stderr', middleware))

    return this
  }

  onError(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    return this.on(['execerr', 'stderr'], action, message)
  }

  onSpecificError(
    matcher: ErrorMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchSpecificError(matcher, middleware))

    return this
  }

  onSuccess(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    return this.on('ok', action, message)
  }

  onExitCode(
    matcher: ExitCodeMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchExitCode(matcher, middleware))

    return this
  }

  onOutput(
    matcher: OutputMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchOutput(matcher, middleware))

    return this
  }
}

export const createCommandRunner = (
  commandLine = '',
  args: string[] = [],
  options: CommandRunnerOptions = {}
): CommandRunner => new CommandRunner(commandLine, args, options, exec.exec)
