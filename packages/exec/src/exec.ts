import {StringDecoder} from 'string_decoder'
import {ExecOptions, ExecOutput, ExecListeners} from './interfaces'
import * as tr from './toolrunner'

export {ExecOptions, ExecOutput, ExecListeners}

/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
 * @param     args               optional arguments for tool. Escaping is handled by the lib.
 * @param     options            optional exec options.  See ExecOptions
 * @returns   Promise<number>    exit code
 */
export async function exec(
  commandLine: string,
  args?: string[],
  options?: ExecOptions
): Promise<number> {
  const commandArgs = tr.argStringToArray(commandLine)
  if (commandArgs.length === 0) {
    throw new Error(`Parameter 'commandLine' cannot be null or empty.`)
  }
  // Path to tool to execute should be first arg
  const toolPath = commandArgs[0]
  args = commandArgs.slice(1).concat(args || [])
  const runner: tr.ToolRunner = new tr.ToolRunner(toolPath, args, options)
  return runner.exec()
}

/**
 * Exec a command and get the output.
 * Output will be streamed to the live console.
 * Returns promise with the exit code and collected stdout and stderr
 *
 * @param     commandLine           command to execute (can include additional args). Must be correctly escaped.
 * @param     args                  optional arguments for tool. Escaping is handled by the lib.
 * @param     options               optional exec options.  See ExecOptions
 * @returns   Promise<ExecOutput>   exit code, stdout, and stderr
 */

export async function getExecOutput(
  commandLine: string,
  args?: string[],
  options?: ExecOptions
): Promise<ExecOutput> {
  let stdout = ''
  let stderr = ''

  //Using string decoder covers the case where a mult-byte character is split
  const stdoutDecoder = new StringDecoder('utf8')
  const stderrDecoder = new StringDecoder('utf8')

  const originalStdoutListener = options?.listeners?.stdout
  const originalStdErrListener = options?.listeners?.stderr

  const stdErrListener = (data: Buffer): void => {
    stderr += stderrDecoder.write(data)
    if (originalStdErrListener) {
      originalStdErrListener(data)
    }
  }

  const stdOutListener = (data: Buffer): void => {
    stdout += stdoutDecoder.write(data)
    if (originalStdoutListener) {
      originalStdoutListener(data)
    }
  }

  const listeners: ExecListeners = {
    ...options?.listeners,
    stdout: stdOutListener,
    stderr: stdErrListener
  }

  const exitCode = await exec(commandLine, args, {...options, listeners})

  //flush any remaining characters
  stdout += stdoutDecoder.end()
  stderr += stderrDecoder.end()

  return {
    exitCode,
    stdout,
    stderr
  }
}
