import process from 'node:process'

import {afterEach, beforeEach} from 'vitest'

/** So we can reset process.env between tests */
const env: NodeJS.ProcessEnv = process.env

beforeEach(() => {
  /**
   * Reset process.env as GitHub Action inputs are on process.env.
   * This is used by `core.getInput()`.
   */
  process.env = {...env}
})
afterEach(() => {
  /**
   * Reset process.env as GitHub Action inputs are on process.env.
   * This is used by `core.getInput()`.
   */
  process.env = {...env}
})
