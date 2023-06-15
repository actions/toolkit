import type {SpyInstance} from 'vitest'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {beforeAll, beforeEach, describe, expect, test, vi} from 'vitest'

import * as state from '../src/state.js'
import {
  DELIMITER,
  TEST_DIRECTORY_PATH,
  TEST_ENV_VAR_PATH,
  UUID
} from './helpers/constants.js'
import {createFileCommandFile, verifyFileCommand} from './helpers/utils.js'

vi.mock('node:crypto', () => ({
  randomUUID: () => UUID
}))

describe('state', () => {
  let stdOutSpy: SpyInstance<
    Parameters<typeof process.stdout.write>,
    ReturnType<typeof process.stdout.write>
  >

  function assertWriteCalls(calls: string[]): void {
    expect(stdOutSpy).toHaveBeenCalledTimes(calls.length)

    for (const [i, call] of calls.entries()) {
      expect(stdOutSpy).toHaveBeenNthCalledWith(i + 1, call)
    }
  }

  beforeAll(() => {
    if (!fs.existsSync(TEST_DIRECTORY_PATH)) {
      fs.mkdirSync(TEST_DIRECTORY_PATH)
    }
  })

  beforeEach(() => {
    stdOutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    process.env['PATH'] = TEST_ENV_VAR_PATH
    process.env['GITHUB_STATE'] = ''
  })

  describe('saveState', () => {
    test('legacy produces the correct command', () => {
      state.saveState('state_1', 'some value')
      assertWriteCalls([`::save-state name=state_1::some value${os.EOL}`])
    })

    test('legacy handles numbers', () => {
      state.saveState('state_1', 1)
      assertWriteCalls([`::save-state name=state_1::1${os.EOL}`])
    })

    test('legacy handles bools', () => {
      state.saveState('state_1', true)
      assertWriteCalls([`::save-state name=state_1::true${os.EOL}`])
    })

    test('produces the correct command and saves the state', () => {
      const command = 'STATE'
      createFileCommandFile(command)
      state.saveState('my state', 'out val')
      verifyFileCommand(
        command,
        `my state<<${DELIMITER}${os.EOL}out val${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('handles boolean inputs', () => {
      const command = 'STATE'
      createFileCommandFile(command)
      state.saveState('my state', true)
      verifyFileCommand(
        command,
        `my state<<${DELIMITER}${os.EOL}true${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('handles number inputs', () => {
      const command = 'STATE'
      createFileCommandFile(command)
      state.saveState('my state', 5)
      verifyFileCommand(
        command,
        `my state<<${DELIMITER}${os.EOL}5${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('does not allow delimiter as value', () => {
      const command = 'STATE'
      createFileCommandFile(command)

      expect(() => {
        state.saveState('my state', `good stuff ${DELIMITER} bad stuff`)
      }).toThrow(
        `Unexpected input: value should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })

    test('does not allow delimiter as name', () => {
      const command = 'STATE'
      createFileCommandFile(command)

      expect(() => {
        state.saveState(`good stuff ${DELIMITER} bad stuff`, 'test')
      }).toThrow(
        `Unexpected input: name should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })
  })

  describe('getState', () => {
    beforeEach(() => {
      process.env[`STATE_TEST_1`] = 'state_val'
    })

    test('getState gets wrapper action state', () => {
      expect(state.getState('TEST_1')).toBe('state_val')
    })
  })
})
