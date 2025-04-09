import * as exec from '../exec'
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
} from './middlware'
import {
  CommandRunnerActionType,
  CommandRunnerEventTypeExtended,
  CommandRunnerMiddleware,
  CommandRunnerOptions
} from './types'

const commandRunnerActions = {
  throw: throwError,
  fail: failAction,
  log: produceLog
} as const

export class CommandRunner extends CommandRunnerBase {
  /**
   * Sets middleware (default or custom) to be executed on command runner run
   * @param event allows to set middleware on certain event
   * - `execerr` - when error happens during command execution
   * - `stderr` - when stderr is not empty
   * - `stdout` - when stdout is not empty
   * - `exitcode` - when exit code is not 0
   * - `ok` - when exit code is 0 and stderr is empty
   * Each event can also be negated by prepending `!` to it, e.g. `!ok`
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .on('ok', 'log', 'Command executed successfully')
   *  .on('!ok', 'throw')
   *  .run()
   * ```
   */
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

  /**
   * Sets middleware (default or custom) to be executed when command executed
   * with empty stdout.
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onEmptyOutput('throw', 'Command did not produce an output')
   *  .run()
   * ```
   */
  onEmptyOutput(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    this.onOutput(stdout => stdout?.trim() === '', action, message)
    return this
  }

  /**
   * Sets middleware (default or custom) to be executed when command failed
   * to execute (either did not find such command or failed to spawn it).
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onExecutionError('throw', 'Command failed to execute')
   *  .run()
   * ```
   */
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

  /**
   * Sets middleware (default or custom) to be executed when command produced
   * non-empty stderr.
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onStdError('throw', 'Command produced an error')
   *  .run()
   * ```
   */
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

  /**
   * Sets middleware (default or custom) to be executed when command produced
   * non-empty stderr or failed to execute (either did not find such command or failed to spawn it).
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onError('throw', 'Command produced an error or failed to execute')
   *  .run()
   * ```
   */
  onError(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    return this.on(['execerr', 'stderr'], action, message)
  }

  /**
   * Sets middleware (default or custom) to be executed when command produced
   * an error that matches provided matcher.
   * @param matcher allows to match specific error, can be either a string (to match error message exactly),
   * a regular expression (to match error message with it) or a function (to match error object with it)
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * await createCommandRunner()
   *  .setCommand('curl')
   *  .setArgs(['-f', 'http://example.com/'])
   *  .onSpecificError('Failed to connect to example.com port 80: Connection refused', 'throw', 'Failed to connect to example.com')
   *  .onSpecificError(/429/, log, 'Too many requests, retrying in 4 seconds')
   *  .onSpecificError(/429/, () => retryIn(4000))
   *  .run()
   * ```
   */
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

  /**
   * Sets middleware (default or custom) to be executed when command produced
   * zero exit code and empty stderr.
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onSuccess('log', 'Command executed successfully')
   *  .run()
   * ```
   */
  onSuccess(
    action: CommandRunnerActionType | CommandRunnerMiddleware,
    message?: string
  ): this {
    return this.on('ok', action, message)
  }

  /**
   * Sets middleware (default or custom) to be executed when command produced an
   * exit code that matches provided matcher.
   * @param matcher allows to match specific exit code, can be either a number (to match exit code exactly)
   * or a string to match exit code against operator and number, e.g. `'>= 0'`
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from event type)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from event type)
   * - `log` - logs the message passed as second argument or a default one (inferred from event type)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * await createCommandRunner()
   *  .setCommand('curl')
   *  .setArgs(['-f', 'http://example.com/'])
   *  .onExitCode(0, 'log', 'Command executed successfully')
   *  .onExitCode('>= 400', 'throw', 'Command failed to execute')
   *  .run()
   * ```
   */
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

  /**
   * Sets middleware (default or custom) to be executed when command produced
   * the stdout that matches provided matcher.
   * @param matcher allows to match specific stdout, can be either a string (to match stdout exactly),
   * a regular expression (to match stdout with it) or a function (to match stdout with it)
   * @param action allows to set action to be executed on event, it can be
   * either default action (passed as string) or a custom middleware, default
   * actions are:
   * - `throw` - throws an error with message passed as second argument or a default one (inferred from matcher)
   * - `fail` - fails the command with message passed as second argument or a default one (inferred from matcher)
   * - `log` - logs the message passed as second argument or a default one (inferred from matcher)
   * @param message optional message to be passed to action, is not relevant when action is a custom middleware
   * @example ```typescript
   * const runner = createCommandRunner('echo', ['hello'])
   * await runner
   *  .onOutput('hello', 'log', 'Command executed successfully')
   *  .onOutput(/hello\S+/, 'log', 'What?')
   *  .onOutput(stdout => stdout.includes('world'), 'log', 'Huh')
   *  .run()
   * ```
   */
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

/**
 * Creates a command runner with provided command line, arguments and options
 * @param commandLine command line to execute
 * @param args arguments to pass to command
 * @param options options to pass to command executor
 * @returns command runner instance
 */
export const createCommandRunner = (
  commandLine = '',
  args: string[] = [],
  options: CommandRunnerOptions = {}
): CommandRunner => new CommandRunner(commandLine, args, options, exec.exec)
