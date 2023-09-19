import * as exec from '@actions/exec'
import * as core from '@actions/core'

export default class CommandHelper {
  private commandText: string
  private args: string[]
  private options: exec.ExecOptions | undefined

  private throwOnError: boolean
  private throwOnEmptyOutput: boolean
  private failOnError: boolean
  private failOnEmptyOutput: boolean

  constructor(
    commandText: string,
    args: string[] = [],
    options: exec.ExecOptions | undefined = {},
    config: {
      throwOnError?: boolean
      throwOnEmptyOutput?: boolean
      failOnError?: boolean
      failOnEmptyOutput?: boolean
    } = {}
  ) {
    this.commandText = commandText
    this.args = args
    this.options = options
    this.throwOnError = config.throwOnError ?? false
    this.throwOnEmptyOutput = config.throwOnEmptyOutput ?? false
    this.failOnError = config.failOnError ?? false
    this.failOnEmptyOutput = config.failOnEmptyOutput ?? false
  }

  async execute(): Promise<exec.ExecOutput> {
    try {
      const output = await exec.getExecOutput(
        this.commandText,
        this.args,
        this.options
      )

      if (this.throwOnError && output.stderr) {
        this.onError(output.stderr).throw()
      }

      if (this.throwOnEmptyOutput && output.stdout.trim() === '') {
        this.onError('Command produced empty output.').throw()
      }

      if (this.failOnError && output.stderr) {
        this.onError(output.stderr).fail()
      }

      if (this.failOnEmptyOutput && output.stdout.trim() === '') {
        this.onError('Command produced empty output.').fail()
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
    core.error(`Error occurred: ${errorMessage}`)

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
