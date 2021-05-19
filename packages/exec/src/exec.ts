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

export async function getExecOutput(commandLine: string, args?: string[], options?: ExecOptions): Promise<ExecOutput> {
  type BufferListener = (data: Buffer) => void
  let stdout = ''
  let stderr = ''
  
  const originalStdoutListener = options?.listeners?.stdout
  const originalStdErrListener = options?.listeners?.stderr
  
  const stdErrListener = (data: Buffer) => {
    stderr += data.toString()
    if (originalStdErrListener) {
      originalStdErrListener(data)
    }
  }

  const stdOutListener = (data: Buffer) => {
    stdout += data.toString()
    if (originalStdoutListener) {
      originalStdoutListener(data)
    }
  }
  
  const listeners: ExecListeners = { 
    ...options?.listeners,
    stdout: stdOutListener,
    stderr: stdErrListener
  }

  const exitCode = await exec(commandLine, args, {...options, listeners} )

  //return undefined for stdout/stderr if they are empty
  return {
    exitCode, 
    stdout: stdout || undefined, 
    stderr: stderr || undefined 
  }
}