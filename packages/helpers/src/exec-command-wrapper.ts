import * as exec from '@actions/exec'
import * as core from '@actions/core'

export default class CommandHelper {
  constructor(
    private commandText: string,
    private args: string[] = [],
    private options: exec.ExecOptions | undefined = {},
    private config: {
      throwOnError?: boolean
      throwOnEmptyOutput?: boolean
      failOnError?: boolean
      failOnEmptyOutput?: boolean
    } = {}
  ) {
    this.commandText = commandText
    this.args = args
    this.options = options
    this.config.throwOnError = config.throwOnError ?? false
    this.config.throwOnEmptyOutput = config.throwOnEmptyOutput ?? false
    this.config.failOnError = config.failOnError ?? false
    this.config.failOnEmptyOutput = config.failOnEmptyOutput ?? false
  }

  async execute(): Promise<exec.ExecOutput> {
    try {
      const output = await exec.getExecOutput(
        this.commandText,
        this.args,
        this.options
      )

      if (this.config.throwOnError && output.stderr) {
        this.onError(output.stderr).throw()
      }

      if (this.config.throwOnEmptyOutput && output.stdout.trim() === '') {
        this.onError(`The command produced an empty output.`).throw()
      }

      if (this.config.failOnError && output.stderr) {
        this.onError(output.stderr).fail()
      }

      if (this.config.failOnEmptyOutput && output.stdout.trim() === '') {
        this.onError(`The command produced an empty output.`).fail()
      }

      return output
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  private onError(errorMessage: string): {
    throw: () => never
    fail: () => void
  } {
    return {
      throw: () => {
        throw new Error(errorMessage)
      },
      fail: () => {
        core.setFailed(errorMessage)
      }
    }
  }
}
