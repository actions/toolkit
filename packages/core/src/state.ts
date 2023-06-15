import {issueCommand} from './lib/command.js'
import {issueFileCommand, prepareKeyValueMessage} from './lib/file-command.js'
import {toCommandValue} from './lib/utils.js'

/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveState(name: string, value: any): void {
  const filePath = process.env['GITHUB_STATE'] || ''
  if (filePath) {
    return issueFileCommand('STATE', prepareKeyValueMessage(name, value))
  }

  issueCommand('save-state', {name}, toCommandValue(value))
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
