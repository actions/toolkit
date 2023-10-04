import * as exec from '@actions/exec'
import {StringDecoder} from 'string_decoder'
import {
  CommandRunnerContext,
  CommandRunnerMiddleware,
  CommandRunnerMiddlewarePromisified,
  CommandRunnerOptions
} from './types'

export const promisifyCommandRunnerMiddleware =
  (
    middleware: CommandRunnerMiddleware<unknown>
  ): CommandRunnerMiddlewarePromisified =>
  async (ctx, next) => {
    return Promise.resolve(middleware(ctx, next))
  }

export const composeCommandRunnerMiddleware =
  (middleware: CommandRunnerMiddlewarePromisified[]) =>
  async (context: CommandRunnerContext, nextGlobal: () => Promise<void>) => {
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

export class CommandRunnerBase<S = unknown> {
  private middleware: CommandRunnerMiddlewarePromisified[] = []

  constructor(
    private commandLine: string,
    private args: string[] = [],
    private options: CommandRunnerOptions,
    private executor: typeof exec.exec = exec.exec
  ) {}

  use(middleware: CommandRunnerMiddleware<S>): this {
    this.middleware.push(
      promisifyCommandRunnerMiddleware(
        middleware as CommandRunnerMiddleware<unknown>
      )
    )
    return this
  }

  async run(
    /* overrides command for this specific execution if not undefined */
    commandLine?: string,

    /* overrides args for this specific execution if not undefined */
    args?: string[],

    /* overrides options for this specific execution if not undefined */
    options?: CommandRunnerOptions
  ): Promise<CommandRunnerContext<S>> {
    const requiredOptions: exec.ExecOptions = {
      ignoreReturnCode: true,
      failOnStdErr: false
    }

    const context: CommandRunnerContext<S> = {
      commandLine: commandLine ?? this.commandLine,
      args: args ?? this.args,
      options: {...(options ?? this.options), ...requiredOptions},
      stdout: null,
      stderr: null,
      execerr: null,
      exitCode: null,
      state: null
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
    await composeCommandRunnerMiddleware(this.middleware)(context, next)

    return context
  }
}
