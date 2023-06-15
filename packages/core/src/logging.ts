import {EOL} from 'node:os'

import {issue, issueCommand} from './lib/command.js'
import {toCommandProperties} from './lib/utils.js'
import {type AnnotationProperties} from './types.js'

/**
 * Gets whether Actions Step Debug is on or not
 */
export const isDebug = (): boolean => {
  return process.env['RUNNER_DEBUG'] === '1'
}

/**
 * Writes debug message to user log
 * @param message debug message
 */
export const debug = (message: string): void => {
  issueCommand('debug', {}, message)
}

/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
export const warning = (
  message: string | Error,
  properties: AnnotationProperties = {}
): void => {
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
export const notice = (
  message: string | Error,
  properties: AnnotationProperties = {}
): void => {
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
export const info = (message: string): void => {
  process.stdout.write(message + EOL)
}

/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
export const startGroup = (name: string): void => {
  issue('group', name)
}

/**
 * End an output group.
 */
export const endGroup = (): void => {
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
export const group = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  startGroup(name)

  let result: T

  try {
    result = await fn()
  } finally {
    endGroup()
  }

  return result
}
