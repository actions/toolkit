import * as exec from '@actions/exec'
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

  setCommand(commandLine: string | ((commandLine: string) => string)): this {
    this.commandLine =
      typeof commandLine === 'function'
        ? commandLine(this.commandLine)
        : commandLine

    return this
  }

  setArgs(args: string[] | ((args: string[]) => string[])): this {
    this.args =
      typeof args === 'function' ? args(this.args) : [...this.args, ...args]

    return this
  }

  setOptions(
    options:
      | CommandRunnerOptions
      | ((options: CommandRunnerOptions) => CommandRunnerOptions)
  ): this {
    this.options =
      typeof options === 'function' ? options(this.options) : options

    return this
  }

  use(middleware: CommandRunnerMiddleware): this {
    this.middleware.push(promisifyFn(middleware))
    return this
  }

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
    } catch (error) {
      context.execerr = error as Error
    }

    const next = async (): Promise<void> => Promise.resolve()
    await composeMiddleware(this.middleware)(context, next)

    return context
  }
}

export function composeMiddleware(
  middleware: CommandRunnerMiddleware[]
): PromisifiedFn<CommandRunnerMiddleware> {
  middleware = middleware.map(mw => promisifyFn(mw))

  return async (
    context: CommandRunnerContext,
    nextGlobal: () => Promise<void>
  ) => {
    let index = 0

    const nextLocal = async (): Promise<void> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++]
        if (middleware === undefined) {
          return
        }

        await currentMiddleware(context, nextLocal)
      }

      await nextGlobal()
    }

    await nextLocal()
  }
}
