import {issue, issueCommand} from './command'
import {issueCommand as issueFileCommand} from './file-command'
import {toCommandProperties, toCommandValue} from './utils'

import * as os from 'os'
import * as path from 'path'
import {v4 as uuidv4} from 'uuid'

import {OidcClient} from './oidc-utils'

/**
 * Interface for getInput options
 */
export interface InputOptions {
  /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
  required?: boolean

  /** Optional. Whether leading/trailing whitespace will be trimmed for the input. Defaults to true */
  trimWhitespace?: boolean
}

/**
 * The code to exit an action
 */
export enum ExitCode {
  /**
   * A code indicating that the action was successful
   */
  Success = 0,

  /**
   * A code indicating that the action was a failure
   */
  Failure = 1
}

/**
 * Optional properties that can be sent with annotatation commands (notice, error, and warning)
 * See: https://docs.github.com/en/rest/reference/checks#create-a-check-run for more information about annotations.
 */
export interface AnnotationProperties {
  /**
   * A title for the annotation.
   */
  title?: string

  /**
   * The path of the file for which the annotation should be created.
   */
  file?: string

  /**
   * The start line for the annotation.
   */
  startLine?: number

  /**
   * The end line for the annotation. Defaults to `startLine` when `startLine` is provided.
   */
  endLine?: number

  /**
   * The start column for the annotation. Cannot be sent when `startLine` and `endLine` are different values.
   */
  startColumn?: number

  /**
   * The start column for the annotation. Cannot be sent when `startLine` and `endLine` are different values.
   * Defaults to `startColumn` when `startColumn` is provided.
   */
  endColumn?: number
}

//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------

/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportVariable(name: string, val: any): void {
  const convertedVal = toCommandValue(val)
  process.env[name] = convertedVal

  const filePath = process.env['GITHUB_ENV'] || ''
  if (filePath) {
    const delimiter = `ghadelimiter_${uuidv4()}`

    // These should realistically never happen, but just in case someone finds a way to exploit uuid generation let's not allow keys or values that contain the delimiter.
    if (name.includes(delimiter)) {
      throw new Error(
        `Unexpected input: name should not contain the delimiter "${delimiter}"`
      )
    }

    if (convertedVal.includes(delimiter)) {
      throw new Error(
        `Unexpected input: value should not contain the delimiter "${delimiter}"`
      )
    }

    const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`
    issueFileCommand('ENV', commandValue)
  } else {
    issueCommand('set-env', {name}, convertedVal)
  }
}

/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
export function setSecret(secret: string): void {
  issueCommand('add-mask', {}, secret)
}

/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
export function addPath(inputPath: string): void {
  const filePath = process.env['GITHUB_PATH'] || ''
  if (filePath) {
    issueFileCommand('PATH', inputPath)
  } else {
    issueCommand('add-path', {}, inputPath)
  }
  process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`
}

/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
export function getInput(name: string, options?: InputOptions): string {
  const val: string =
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }

  if (options && options.trimWhitespace === false) {
    return val
  }

  return val.trim()
}

/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
export function getMultilineInput(
  name: string,
  options?: InputOptions
): string[] {
  const inputs: string[] = getInput(name, options)
    .split('\n')
    .filter(x => x !== '')

  return inputs
}

/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
export function getBooleanInput(name: string, options?: InputOptions): boolean {
  const trueValue = ['true', 'True', 'TRUE']
  const falseValue = ['false', 'False', 'FALSE']
  const val = getInput(name, options)
  if (trueValue.includes(val)) return true
  if (falseValue.includes(val)) return false
  throw new TypeError(
    `Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
      `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
  )
}

/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setOutput(name: string, value: any): void {
  process.stdout.write(os.EOL)
  issueCommand('set-output', {name}, value)
}

/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
export function setCommandEcho(enabled: boolean): void {
  issue('echo', enabled ? 'on' : 'off')
}

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------

/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export function setFailed(message: string | Error): void {
  process.exitCode = ExitCode.Failure

  error(message)
}

//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------

/**
 * Gets whether Actions Step Debug is on or not
 */
export function isDebug(): boolean {
  return process.env['RUNNER_DEBUG'] === '1'
}

/**
 * Writes debug message to user log
 * @param message debug message
 */
export function debug(message: string): void {
  issueCommand('debug', {}, message)
}

/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
export function error(
  message: string | Error,
  properties: AnnotationProperties = {}
): void {
  issueCommand(
    'error',
    toCommandProperties(properties),
    message instanceof Error ? message.toString() : message
  )
}

/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
export function warning(
  message: string | Error,
  properties: AnnotationProperties = {}
): void {
  issueCommand(
    'warning',
    toCommandProperties(properties),
    message instanceof Error ? message.toString() : message
  )
}

/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
export function notice(
  message: string | Error,
  properties: AnnotationProperties = {}
): void {
  issueCommand(
    'notice',
    toCommandProperties(properties),
    message instanceof Error ? message.toString() : message
  )
}

/**
 * Writes info to log with console.log.
 * @param message info message
 */
export function info(message: string): void {
  process.stdout.write(message + os.EOL)
}

/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
export function startGroup(name: string): void {
  issue('group', name)
}

/**
 * End an output group.
 */
export function endGroup(): void {
  issue('endgroup')
}

/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
export async function group<T>(name: string, fn: () => Promise<T>): Promise<T> {
  startGroup(name)

  let result: T

  try {
    result = await fn()
  } finally {
    endGroup()
  }

  return result
}

//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------

/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveState(name: string, value: any): void {
  issueCommand('save-state', {name}, value)
}

/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
export function getState(name: string): string {
  return process.env[`STATE_${name}`] || ''
}

export async function getIDToken(aud?: string): Promise<string> {
  return await OidcClient.getIDToken(aud)
}

/**
 * Summary exports
 */
export {summary} from './summary'

/**
 * @deprecated use core.summary
 */
export {markdownSummary} from './summary'

/**
 * Path exports
 */
export {toPosixPath, toWin32Path, toPlatformPath} from './path-utils'
