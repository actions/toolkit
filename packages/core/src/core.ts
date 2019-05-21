import {ExitCode} from '@actions/exit'
import * as intm from './command'

/**
 * Interface for getInput options
 */
export interface InputOptions {
  /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
  required?: boolean
}

//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------

/**
 * sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function exportVariable(name: string, val: string) {
  process.env[name] = val
  intm.issueCommand('set-variable', {name}, val)
}

/**
 * exports the variable and registers a secret which will get masked from logs
 * @param name the name of the variable to set
 * @param val value of the secret
 */
export function exportSecret(name: string, val: string) {
  exportVariable(name, val)
  intm.issueCommand('set-secret', {}, val)
}

/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
export function getInput(name: string, options?: InputOptions): string {
  const val: string =
    process.env[`INPUT_${name.replace(' ', '_').toUpperCase()}`] || ''
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }

  return val.trim()
}

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------

/**
 * Sets the action status to neutral
 */
export function setNeutral() {
  process.exitCode = ExitCode.Neutral
}

/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export function setFailed(message: string) {
  process.exitCode = ExitCode.Failure
  error(message)
}

//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------

/**
 * Writes debug message to user log
 * @param message debug message
 */
export function debug(message: string) {
  intm.issueCommand('debug', {}, message)
}

/**
 * Adds an error issue
 * @param message error issue message
 */
export function error(message: string) {
  intm.issue('error', message)
}

/**
 * Adds an warning issue
 * @param message warning issue message
 */
export function warning(message: string) {
  intm.issue('warning', message)
}
