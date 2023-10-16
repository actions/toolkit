import * as exec from '../exec'
import {StringDecoder} from 'string_decoder'
import {
  CommandRunnerContext,
  CommandRunnerMiddleware,
  CommandRunnerOptions
} from './types'
import {PromisifiedFn, promisifyFn} from './utils'

export class CommandRunnerBase {
  private middleware: PromisifiedFn<CommandRunnerMiddleware>[] = []

  constructor(
    private commandLine = '',
    private args: string[] = [],
    private options: CommandRunnerOptions,
    private executor: typeof exec.exec = exec.exec
  ) {}

  /**
   * Sets command to be executed, passing a callback
   * allows to modify command based on currently set command
   */
  setCommand(commandLine: string | ((commandLine: string) => string)): this {
    this.commandLine =
      typeof commandLine === 'function'
        ? commandLine(this.commandLine)
        : commandLine

    return this
  }

  /**
   * Sets command arguments, passing a callback
   * allows to modify arguments based on currently set arguments
   */
  setArgs(args: string[] | ((args: string[]) => string[])): this {
    this.args =
      typeof args === 'function' ? args(this.args) : [...this.args, ...args]

    return this
  }

  /**
   * Sets options for command executor (exec.exec by default), passing a callback
   * allows to modify options based on currently set options
   */
  setOptions(
    options:
      | CommandRunnerOptions
      | ((options: CommandRunnerOptions) => CommandRunnerOptions)
  ): this {
    this.options =
      typeof options === 'function' ? options(this.options) : options

    return this
  }

  /**
   * Sets arbitrary middleware to be executed on command runner run
   * middleware is executed in the order it was added
   * @param middleware middleware to be executed
   * @example
   * ```ts
   * const runner = new CommandRunner()
   * runner.use(async (ctx, next) => {
   *  console.log('before')
   *  const {
   *    exitCode // exit code of the command
   *    stdout // stdout of the command
   *    stderr // stderr of the command
   *    execerr // error thrown by the command executor
   *    commandLine // command line that was executed
   *    args // arguments that were passed to the command
   *    options // options that were passed to the command
   *  } = ctx
   *  await next()
   *  console.log('after')
   * })
   * ```
   */
  use(middleware: CommandRunnerMiddleware): this {
    this.middleware.push(promisifyFn(middleware))
    return this
  }

  /**
   * Runs command with currently set options and arguments
   */
  async run(
    /* overrides command for this specific execution if not undefined */
    commandLine?: string,

    /* overrides args for this specific execution if not undefined */
    args?: string[],

    /* overrides options for this specific execution if not undefined */
    options?: CommandRunnerOptions
  ): Promise<CommandRunnerContext> {
    const requiredOptions: exec.ExecOptions = {
      ignoreReturnCode: true,
      failOnStdErr: false
    }

    const context: CommandRunnerContext = {
      commandLine: commandLine ?? this.commandLine,
      args: args ?? this.args,
      options: {...(options ?? this.options), ...requiredOptions},
      stdout: null,
      stderr: null,
      execerr: null,
      exitCode: null
    }

    if (!context.commandLine) {
      throw new Error('Command was not specified')
    }

    try {
      const stderrDecoder = new StringDecoder('utf8')
      const stdErrListener = (data: Buffer): void => {
        context.stderr = (context.stderr ?? '') + stderrDecoder.write(data)
        options?.listeners?.stderr?.(data)
      }

      const stdoutDecoder = new StringDecoder('utf8')
      const stdOutListener = (data: Buffer): void => {
        context.stdout = (context.stdout ?? '') + stdoutDecoder.write(data)
        options?.listeners?.stdout?.(data)
      }

      context.exitCode = await this.executor(
        context.commandLine,
        context.args,
        {
          ...context.options,
          listeners: {
            ...options?.listeners,
            stdout: stdOutListener,
            stderr: stdErrListener
          }
        }
      )

      context.stdout = (context.stdout ?? '') + stdoutDecoder.end()
      context.stderr = (context.stderr ?? '') + stderrDecoder.end()
    } catch (error) {
      context.execerr = error as Error
    }

    const next = async (): Promise<void> => Promise.resolve()
    await composeMiddleware(this.middleware)(context, next)

    return context
  }
}

/**
 * Composes multiple middleware into a single middleware
 * implements a chain of responsibility pattern
 * with next function passed to each middleware
 * and each middleware being able to call next() to pass control to the next middleware
 * or not call next() to stop the chain,
 * it is also possible to run code after the next was called by using async/await
 * for a cleanup or other purposes.
 * This behavior is mostly implemented to be similar to express, koa or other middleware based frameworks
 * in order to avoid confusion. Executing code after next() usually would not be needed.
 */
export function composeMiddleware(
  middleware: CommandRunnerMiddleware[]
): PromisifiedFn<CommandRunnerMiddleware> {
  // promisify all passed middleware
  middleware = middleware.map(mw => promisifyFn(mw))

  return async (
    context: CommandRunnerContext,
    nextGlobal: () => Promise<void>
  ) => {
    let index = 0

    /**
     * Picks the first not-yet-executed middleware from the list and
     * runs it, passing itself as next function for
     * that middleware to call, therefore would be called
     * by each middleware in the chain
     */
    const nextLocal = async (): Promise<void> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++]
        if (middleware === undefined) {
          return
        }

        await currentMiddleware(context, nextLocal)
      }

      /**
       * If no middlware left to be executed
       * will call the next funtion passed to the
       * composed middleware
       */
      await nextGlobal()
    }

    /**
     * Starts the chain of middleware execution by
     * calling nextLocal directly
     */
    await nextLocal()
  }
}
