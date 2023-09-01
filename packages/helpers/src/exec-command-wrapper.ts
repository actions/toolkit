import * as core from '@actions/core'
import * as exec from '@actions/exec'

export class Command {
  private readonly commandText: string
  private readonly args: string[]
  private readonly options: exec.ExecOptions | undefined

  private failOnError = false
  private throwOnError = false

  private failOnEmptyOutput = false
  private throwOnEmptyOutput = false

  constructor(
    commandText: string,
    args: string[],
    options: exec.ExecOptions | undefined = undefined
  ) {
    this.commandText = commandText
    this.args = args
    this.options = options
  }

  get failOn(): {error: () => Command; empty: () => Command} {
    return {
      error: this.setFailOnError,
      empty: this.setFailOnEmptyOutput
    }
  }

  get throwOn(): {error: () => Command; empty: () => Command} {
    return {
      error: this.setThrowOnError,
      empty: this.setThrowOnEmptyOutput
    }
  }

  private setFailOnError = (): Command => {
    this.failOnError = true
    return this
  }

  private setThrowOnError = (): Command => {
    this.throwOnError = true
    return this
  }

  private setFailOnEmptyOutput = (): Command => {
    this.failOnEmptyOutput = true
    return this
  }

  private setThrowOnEmptyOutput = (): Command => {
    this.throwOnEmptyOutput = true
    return this
  }

  private setFailedOnNonZeroExitCode(
    command: string,
    exitCode: number,
    error: string
  ): void {
    if (exitCode !== 0) {
      error = !error.trim()
        ? `The '${command}' command failed with exit code: ${exitCode}`
        : error
      core.setFailed(error)
    }
    return
  }

  private throwErrorOnNonZeroExitCode(
    command: string,
    exitCode: number,
    error: string
  ): void {
    if (exitCode !== 0) {
      error = !error.trim()
        ? `The '${command}' command failed with exit code: ${exitCode}`
        : error
      throw new Error(error)
    }
    return
  }

  async execute(): Promise<string> {
    const {stdout, stderr, exitCode} = await exec.getExecOutput(
      this.commandText,
      this.args,
      this.options
    )

    if (this.failOnError) {
      this.setFailedOnNonZeroExitCode(this.commandText, exitCode, stderr)
      return stdout.trim()
    }

    if (this.throwOnError) {
      this.throwErrorOnNonZeroExitCode(this.commandText, exitCode, stderr)
      return stdout.trim()
    }

    if (this.failOnEmptyOutput && !stdout.trim()) {
      core.setFailed(
        `The '${this.commandText}' command failed with empty output`
      )
      return stdout.trim()
    }

    if (this.throwOnEmptyOutput && !stdout.trim()) {
      throw new Error(
        `The '${this.commandText}' command failed with empty output`
      )
    }

    return stdout.trim()
  }
}

// new Command('echo', ['hello', 'world'])
//   .failOn.error()
//   .execute()
