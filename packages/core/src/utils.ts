// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

import {AnnotationProperties} from './core'
import {CommandProperties} from './command'

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
 * See IssueCommandProperties: https://github.com/actions/runner/blob/fff31e11c5208854164adb5e2532b822fbca7574/src/Runner.Worker/ActionCommandManager.cs#L646
 */
export function toCommandProperties(
  annotationProperties: AnnotationProperties
): CommandProperties {
  if (!Object.keys(annotationProperties).length) {
    return {}
  }

  return {
    title: annotationProperties.title,
    line: annotationProperties.startLine,
    endLine: annotationProperties.endLine,
    col: annotationProperties.startColumn,
    endColumn: annotationProperties.endColumn
  }
}
