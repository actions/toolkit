import * as exec from '@actions/exec'
import {CommandRunnerBase} from './core'
import {
  ErrorMatcher,
  ExitCodeMatcher,
  OutputMatcher,
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
  CommandRunnerMiddleware
} from './types'

const commandRunnerActions = {
  throw: throwError,
  fail: failAction,
  log: produceLog
} as const

export class CommandRunner<S = unknown> extends CommandRunnerBase<S> {
  on(
    event: CommandRunnerEventTypeExtended | CommandRunnerEventTypeExtended[],
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchEvent(event, middleware as CommandRunnerMiddleware[]))

    return this
  }

  onEmptyOutput(
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    this.on('no-stdout', action, message)

    return this
  }

  onExecutionError(
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(
      matchSpecificError(
        ({type}) => type === 'execerr',
        middleware as CommandRunnerMiddleware[]
      )
    )

    return this
  }

  onStdError(
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(
      matchSpecificError(
        ({type}) => type === 'stderr',
        middleware as CommandRunnerMiddleware[]
      )
    )

    return this
  }

  onError(
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    return this.on(['execerr', 'stderr'], action, message)
  }

  onSpecificError(
    matcher: ErrorMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(
      matchSpecificError(matcher, middleware as CommandRunnerMiddleware[])
    )

    return this
  }

  onSuccess(
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    return this.on('ok', action, message)
  }

  onExitCode(
    matcher: ExitCodeMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchExitCode(matcher, middleware as CommandRunnerMiddleware[]))

    return this
  }

  onOutput(
    matcher: OutputMatcher,
    action: CommandRunnerActionType | CommandRunnerMiddleware<S>,
    message?: string
  ): this {
    const middleware =
      typeof action === 'string'
        ? [commandRunnerActions[action](message)]
        : [action]

    this.use(matchOutput(matcher, middleware as CommandRunnerMiddleware[]))

    return this
  }
}

export const commandPipeline = <S = unknown>(
  commandLine: string,
  args: string[] = [],
  options: Record<string, unknown> = {}
): CommandRunner<S> =>
  new CommandRunner(commandLine, args, options, exec.getExecOutput)
