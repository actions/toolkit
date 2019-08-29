import * as os from 'os'

// For internal use, subject to change.

interface CommandProperties {
  [key: string]: string
}

/**
 * Commands
 *
 * Command Format:
 *   ##[name key=value;key=value]message
 *
 * Examples:
 *   ##[warning]This is the user warning message
 *   ##[set-secret name=mypassword]definitelyNotAPassword!
 */
export function issueCommand(
  command: string,
  properties: CommandProperties,
  message: string
): void {
  const cmd = new Command(command, properties, message)
  process.stdout.write(cmd.toString() + os.EOL)
}

export function issue(name: string, message: string = ''): void {
  issueCommand(name, {}, message)
}

const CMD_PREFIX = '##['

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
    let cmdStr = CMD_PREFIX + this.command

    if (this.properties && Object.keys(this.properties).length > 0) {
      cmdStr += ' '
      for (const key in this.properties) {
        if (this.properties.hasOwnProperty(key)) {
          const val = this.properties[key]
          if (val) {
            // safely append the val - avoid blowing up when attempting to
            // call .replace() if message is not a string for some reason
            cmdStr += `${key}=${escape(`${val || ''}`)};`
          }
        }
      }
    }

    cmdStr += ']'

    // safely append the message - avoid blowing up when attempting to
    // call .replace() if message is not a string for some reason
    const message = `${this.message || ''}`
    cmdStr += escapeData(message)

    return cmdStr
  }
}

function escapeData(s: string): string {
  return s.replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function escape(s: string): string {
  return s
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/]/g, '%5D')
    .replace(/;/g, '%3B')
}
