import type {AnnotationProperties} from './types.js'

import {issueCommand} from './lib/command.js'
import {toCommandProperties} from './lib/utils.js'
import {ExitCode} from './types.js'

/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
export const error = (
  message: string | Error,
  properties: AnnotationProperties = {}
): void => {
  issueCommand(
    'error',
    toCommandProperties(properties),
    message instanceof Error ? message.toString() : message
  )
}

/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export const setFailed = (message: string | Error): void => {
  process.exitCode = ExitCode.Failure

  error(message)
}
