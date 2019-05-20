import os = require('os')

/**
 * Commands
 *
 * Command Format:
 *   ##[name key=value;key=value]message
 *
 * Examples:
 *   ##[warning]This is the user warning message
 *   ##[set-secret name=mypassword]definatelyNotAPassword!
 */
export function _issueCommand(
  command: string,
  properties: any,
  message: string
) {
  var cmd = new _Command(command, properties, message)
  _writeLine(cmd.toString())
}

export function _issue(name: string, message: string) {
  _issueCommand(name, {}, message)
}

let CMD_PREFIX = '##['

export class _Command {
  constructor(command: string, properties: any, message: string) {
    if (!command) {
      command = 'missing.command'
    }

    this.command = command
    this.properties = properties
    this.message = message
  }

  public command: string
  public message: string
  public properties: any

  public toString() {
    var cmdStr = CMD_PREFIX + this.command

    if (this.properties && Object.keys(this.properties).length > 0) {
      cmdStr += ' '
      for (var key in this.properties) {
        if (this.properties.hasOwnProperty(key)) {
          var val = this.properties[key]
          if (val) {
            // safely append the val - avoid blowing up when attempting to
            // call .replace() if message is not a string for some reason
            cmdStr += key + '=' + escape('' + (val || '')) + ';'
          }
        }
      }
    }

    cmdStr += ']'

    // safely append the message - avoid blowing up when attempting to
    // call .replace() if message is not a string for some reason
    let message: string = '' + (this.message || '')
    cmdStr += escapedata(message)

    return cmdStr
  }
}

export function _commandFromString(commandLine: string) {
  var preLen = CMD_PREFIX.length
  var lbPos = commandLine.indexOf('[')
  var rbPos = commandLine.indexOf(']')
  if (lbPos == -1 || rbPos == -1 || rbPos - lbPos < 3) {
    throw new Error('Invalid command brackets')
  }
  var cmdInfo = commandLine.substring(lbPos + 1, rbPos)
  var spaceIdx = cmdInfo.indexOf(' ')

  var command = cmdInfo
  var properties: {[key: string]: string} = {}

  if (spaceIdx > 0) {
    command = cmdInfo.trim().substring(0, spaceIdx)
    var propSection = cmdInfo.trim().substring(spaceIdx + 1)

    var propLines: string[] = propSection.split(';')
    propLines.forEach(function(propLine: string) {
      propLine = propLine.trim()
      if (propLine.length > 0) {
        var eqIndex = propLine.indexOf('=')
        if (eqIndex == -1) {
          throw new Error('Invalid property: ' + propLine)
        }

        var key: string = propLine.substring(0, eqIndex)
        var val: string = propLine.substring(eqIndex + 1)

        properties[key] = unescape(val)
      }
    })
  }

  let msg: string = unescapedata(commandLine.substring(rbPos + 1))
  var cmd = new _Command(command, properties, msg)
  return cmd
}

function escapedata(s: string): string {
  return s.replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function unescapedata(s: string): string {
  return s.replace(/%0D/g, '\r').replace(/%0A/g, '\n')
}

function escape(s: string): string {
  return s
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/]/g, '%5D')
    .replace(/;/g, '%3B')
}

function unescape(s: string): string {
  return s
    .replace(/%0D/g, '\r')
    .replace(/%0A/g, '\n')
    .replace(/%5D/g, ']')
    .replace(/%3B/g, ';')
}

//-----------------------------------------------------
// Streams: allow to override the stream
//-----------------------------------------------------

let _outStream = process.stdout
let _errStream = process.stderr

export function _writeLine(str: string): void {
  _outStream.write(str + os.EOL)
}

export function _setStdStream(stdStream: NodeJS.WriteStream): void {
  _outStream = stdStream
}

export function _setErrStream(errStream: NodeJS.WriteStream): void {
  _errStream = errStream
}
