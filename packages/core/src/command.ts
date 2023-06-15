import * as os from 'node:os'

import {toCommandValue} from './utils.js'

// For internal use, subject to change.

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CommandProperties {
  [key: string]: any
}

/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
export function issueCommand(
  command: string,
  properties: CommandProperties,
  message: any
): void {
  const cmd = new Command(command, properties, message)
  process.stdout.write(cmd.toString() + os.EOL)
}

export function issue(name: string, message = ''): void {
  issueCommand(name, {}, message)
}

const CMD_STRING = '::'

class Command {
  private readonly command: string
  private readonly message: string
  private readonly properties: CommandProperties

  constructor(command: string, properties: CommandProperties, message: string) {
    if (!command) {
      command = 'missing.command'
    }

    this.command = command
    this.properties = properties
    this.message = message
  }

  toString(): string {
    let cmdStr = CMD_STRING + this.command

    if (this.properties && Object.keys(this.properties).length > 0) {
      cmdStr += ' '
      let first = true
      for (const key in this.properties) {
        if (this.properties.hasOwnProperty(key)) {
          const val = this.properties[key]
          if (val) {
            if (first) {
              first = false
            } else {
              cmdStr += ','
            }

            cmdStr += `${key}=${escapeProperty(val)}`
          }
        }
      }
    }

    cmdStr += `${CMD_STRING}${escapeData(this.message)}`
    return cmdStr
  }
}

function escapeData(s: any): string {
  return toCommandValue(s)
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
}

function escapeProperty(s: any): string {
  return toCommandValue(s)
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
    .replaceAll(':', '%3A')
    .replaceAll(',', '%2C')
}
