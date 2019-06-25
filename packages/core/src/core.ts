import {issue, issueCommand} from './command'

import * as path from 'path'

/**
 * Interface for getInput options
 */
export interface InputOptions {
  /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
  required?: boolean
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
  Failure = 1,

  /**
   * A code indicating that the action is complete, but neither succeeded nor failed
   */
  Neutral = 78
}

//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------

/**
 * sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function exportVariable(name: string, val: string): void {
  process.env[name] = val
  issueCommand('set-env', {name}, val)
}

/**
 * exports the variable and registers a secret which will get masked from logs
 * @param name the name of the variable to set
 * @param val value of the secret
 */
export function exportSecret(name: string, val: string): void {
  exportVariable(name, val)
  issueCommand('set-secret', {}, val)
}

/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
export function addPath(inputPath: string): void {
  issueCommand('add-path', {}, inputPath)
  process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`
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

/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store
 */
export function setOutput(name: string, value: string): void {
  issueCommand('set-output', {name}, value)
}

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------

/**
 * Sets the action status to neutral
 */
export function setNeutral(): void {
  process.exitCode = ExitCode.Neutral
}

/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export function setFailed(message: string): void {
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
export function debug(message: string): void {
  issueCommand('debug', {}, message)
}

/**
 * Adds an error issue
 * @param message error issue message
 */
export function error(message: string): void {
  issue('error', message)
}

/**
 * Adds an warning issue
 * @param message warning issue message
 */
export function warning(message: string): void {
  issue('warning', message)
}
