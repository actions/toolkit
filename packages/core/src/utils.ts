// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

import {CommandProperties, issueCommand} from './command'

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

/**
 * Writes debug message to user log
 * @param message debug message
 */
 export function debug(message: string): void {
  issueCommand('debug', {}, message)
}

/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
 export function setSecret(secret: string): void {
  issueCommand('add-mask', {}, secret)
}

/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
export function toCommandValue(input: any): string {
  if (input === null || input === undefined) {
    return ''
  } else if (typeof input === 'string' || input instanceof String) {
    return input as string
  }
  return JSON.stringify(input)
}

/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
export function toCommandProperties(
  annotationProperties: AnnotationProperties
): CommandProperties {
  if (!Object.keys(annotationProperties).length) {
    return {}
  }

  return {
    title: annotationProperties.title,
    file: annotationProperties.file,
    line: annotationProperties.startLine,
    endLine: annotationProperties.endLine,
    col: annotationProperties.startColumn,
    endColumn: annotationProperties.endColumn
  }
}
