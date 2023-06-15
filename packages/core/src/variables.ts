import type {InputOptions} from './types.js'

import {EOL} from 'node:os'
import {delimiter} from 'node:path'

import {issue, issueCommand} from './lib/command.js'
import {issueFileCommand, prepareKeyValueMessage} from './lib/file-command.js'
import {toCommandValue} from './lib/utils.js'

/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportVariable = (name: string, val: any): void => {
  const convertedVal = toCommandValue(val)
  process.env[name] = convertedVal

  const filePath = process.env['GITHUB_ENV'] || ''
  if (filePath) {
    return issueFileCommand('ENV', prepareKeyValueMessage(name, val))
  }

  issueCommand('set-env', {name}, convertedVal)
}

/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
export const setSecret = (secret: string): void => {
  issueCommand('add-mask', {}, secret)
}

/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
export const addPath = (inputPath: string): void => {
  const filePath = process.env['GITHUB_PATH'] || ''
  if (filePath) {
    issueFileCommand('PATH', inputPath)
  } else {
    issueCommand('add-path', {}, inputPath)
  }
  process.env['PATH'] = `${inputPath}${delimiter}${process.env['PATH']}`
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
export const getInput = (name: string, options?: InputOptions): string => {
  const val: string =
    process.env[`INPUT_${name.replaceAll(' ', '_').toUpperCase()}`] || ''
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
export const getMultilineInput = (
  name: string,
  options?: InputOptions
): string[] => {
  const inputs: string[] = getInput(name, options)
    .split('\n')
    .filter(x => x !== '')

  if (options && options.trimWhitespace === false) {
    return inputs
  }

  return inputs.map(input => input.trim())
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
export const getBooleanInput = (
  name: string,
  options?: InputOptions
): boolean => {
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
export const setOutput = (name: string, value: any): void => {
  const filePath = process.env['GITHUB_OUTPUT'] || ''
  if (filePath) {
    return issueFileCommand('OUTPUT', prepareKeyValueMessage(name, value))
  }

  process.stdout.write(EOL)
  issueCommand('set-output', {name}, toCommandValue(value))
}

/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
export const setCommandEcho = (enabled: boolean): void => {
  issue('echo', enabled ? 'on' : 'off')
}
