// For internal use, subject to change.

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs'
import * as os from 'os'
import {v4 as uuidv4} from 'uuid'
import {toCommandValue} from './utils'

export function issueFileCommand(command: string, message: any): void {
  const filePath = process.env[`GITHUB_${command}`]
  if (!filePath) {
    throw new Error(
      `Unable to find environment variable for file command ${command}`
    )
  }

  // do not use appendFileSync() because of CodeQL js/file-system-race
  let fd
  try {
    fd = fs.openSync(filePath, 'a')
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing file at path: ${filePath}`)
    } else {
      throw err
    }
  }
  
  try {
    fs.writeSync(fd, `${toCommandValue(message)}${os.EOL}`, null, 'utf8')
  } finally {
    fs.closeSync(fd)
  }
}

export function prepareKeyValueMessage(key: string, value: any): string {
  const delimiter = `ghadelimiter_${uuidv4()}`
  const convertedValue = toCommandValue(value)

  // These should realistically never happen, but just in case someone finds a
  // way to exploit uuid generation let's not allow keys or values that contain
  // the delimiter.
  if (key.includes(delimiter)) {
    throw new Error(
      `Unexpected input: name should not contain the delimiter "${delimiter}"`
    )
  }

  if (convertedValue.includes(delimiter)) {
    throw new Error(
      `Unexpected input: value should not contain the delimiter "${delimiter}"`
    )
  }

  return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`
}
