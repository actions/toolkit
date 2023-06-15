import {describe, expect, test} from 'vitest'

import {toCommandProperties} from '../../src/lib/utils.js'

describe('lib/utils', () => {
  describe('toCommandProperties', () => {
    test('annotations map field names correctly', () => {
      const commandProperties = toCommandProperties({
        title: 'A title',
        file: 'root/test.txt',
        startColumn: 1,
        endColumn: 2,
        startLine: 5,
        endLine: 5
      })
      expect(commandProperties.title).toBe('A title')
      expect(commandProperties.file).toBe('root/test.txt')
      expect(commandProperties.col).toBe(1)
      expect(commandProperties.endColumn).toBe(2)
      expect(commandProperties.line).toBe(5)
      expect(commandProperties.endLine).toBe(5)

      expect(commandProperties.startColumn).toBeUndefined()
      expect(commandProperties.startLine).toBeUndefined()
    })
  })
})
