import * as exec from '@actions/exec'
import {
  CommandRunnerContext,
  CommandRunnerMiddleware,
  CommandRunnerMiddlewarePromisified
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
  private tmpArgs: string[] = []

  constructor(
    private commandLine: string,
    private args: string[] = [],
    private options: exec.ExecOptions = {},
    private executor: typeof exec.getExecOutput = exec.getExecOutput
  ) {}

  /**
   * Adds additional arguments to the command
   * for the one time execution.
   */
  addArgs(...args: string[]): this {
    this.tmpArgs = [...this.args, ...args]
    return this
  }

  /** Overrides command arguments for one time execution */
  withArgs(...args: string[]): this {
    this.tmpArgs = args
    return this
  }

  /** Retrieves args for one-time execution and clears them afterwards */
  private getTmpArgs(): string[] | null {
    if (this.tmpArgs.length === 0) return null

    const args = this.tmpArgs

    this.tmpArgs = []

    return args
  }

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
    options?: exec.ExecOptions
  ): Promise<CommandRunnerContext<S>> {
    const tmpArgs = this.getTmpArgs()

    const context: CommandRunnerContext<S> = {
      commandLine: commandLine ?? this.commandLine,
      args: args ?? tmpArgs ?? this.args,
      options: options ?? this.options,
      stdout: null,
      stderr: null,
      execerr: null,
      exitCode: null,
      state: null
    }

    try {
      const {stdout, stderr, exitCode} = await this.executor(
        context.commandLine,
        context.args,
        context.options
      )

      context.stdout = stdout
      context.stderr = stderr
      context.exitCode = exitCode
    } catch (error) {
      context.execerr = error as Error
    }

    const next = async (): Promise<void> => Promise.resolve()
    await composeCommandRunnerMiddleware(this.middleware)(context, next)

    return context
  }
}
