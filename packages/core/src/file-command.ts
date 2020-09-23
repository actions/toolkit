// For internal use, subject to change.

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs'
import * as os from 'os'
import {toCommandValue} from './utils'

export function issueCommand(command: string, message: any): void {
  const filePath = process.env[`GITHUB_${command}`]
  if (!filePath) {
    throw new Error(
      `Unable to find environment variable for file command ${command}`
    )
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file at path: ${filePath}`)
  }

  fs.appendFileSync(filePath, `${toCommandValue(message)}${os.EOL}`, {
    encoding: 'utf8'
  })
}
