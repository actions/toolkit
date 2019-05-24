import * as im from './interfaces'
import * as tr from './toolrunner'

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
  options?: im.ExecOptions
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
