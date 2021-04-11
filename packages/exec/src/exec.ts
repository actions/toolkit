import {ExecOptions} from './interfaces'
import * as tr from './toolrunner'

export {ExecOptions}

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
 * Get command output
 * Returns promise with stdout
 *
 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
 * @param     args               optional arguments for tool. Escaping is handled by the lib.
 * @param     options            optional exec options.  See ExecOptions
 * @returns   Promise<string>    exit code
 */
export async function getCommandOutput(
  commandLine: string,
  args?: [],
  options: Omit<ExecOptions, 'listeners'> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = ''
    let err = ''

    const opts = {
      ...options,
      listeners: {
        stdout: (data: Buffer) => (out += data.toString()),
        stderr: (data: Buffer) => (err += data.toString())
      }
    }

    exec(commandLine, args, opts).then(() => {
      if (err) return reject(err)
      resolve(out)
    })
  })
}
