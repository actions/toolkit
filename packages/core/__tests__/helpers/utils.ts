import fs from 'node:fs'
import path from 'node:path'

import {expect} from 'vitest'

import {TEST_DIRECTORY_PATH} from './constants.js'

export const verifyFileCommand = (
  command: string,
  expectedContents: string
): void => {
  const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
  const contents = fs.readFileSync(filePath, 'utf8')
  try {
    expect(contents).toStrictEqual(expectedContents)
  } finally {
    fs.unlinkSync(filePath)
  }
}

export const createFileCommandFile = (command: string): void => {
  const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
  process.env[`GITHUB_${command}`] = filePath
  fs.appendFileSync(filePath, '', {
    encoding: 'utf8'
  })
}
