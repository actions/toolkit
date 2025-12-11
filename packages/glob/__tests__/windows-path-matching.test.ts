/**
 * Test to validate that glob works correctly on Windows with backslash paths
 * This test validates the fix for glob not working on GitHub's Windows runners
 */

import {MatchKind} from '../src/internal-match-kind'
import {Pattern} from '../src/internal-pattern'

const IS_WINDOWS = process.platform === 'win32'

describe('Windows path matching', () => {
  it('matches paths with backslashes on Windows', () => {
    if (!IS_WINDOWS) {
      // This test is only relevant on Windows
      return
    }

    // Test basic pattern matching with Windows paths
    const pattern = new Pattern('C:\\Users\\test\\*')
    
    // The itemPath would come from fs.readdir with backslashes on Windows
    const itemPath = 'C:\\Users\\test\\file.txt'
    
    // This should match because the pattern and path both refer to the same file
    expect(pattern.match(itemPath)).toBe(MatchKind.All)
  })

  it('partial matches work with backslashes on Windows', () => {
    if (!IS_WINDOWS) {
      return
    }

    // Test partial matching with Windows paths
    const pattern = new Pattern('C:\\Users\\test\\**')
    
    // Should partially match parent directory
    expect(pattern.partialMatch('C:\\Users')).toBe(true)
    expect(pattern.partialMatch('C:\\Users\\test')).toBe(true)
  })

  it('matches globstar patterns with backslashes on Windows', () => {
    if (!IS_WINDOWS) {
      return
    }

    const pattern = new Pattern('C:\\foo\\**')
    
    // Should match the directory itself and descendants
    expect(pattern.match('C:\\foo')).toBe(MatchKind.All)
    expect(pattern.match('C:\\foo\\bar')).toBe(MatchKind.All)
    expect(pattern.match('C:\\foo\\bar\\baz.txt')).toBe(MatchKind.All)
  })

  it('matches wildcard patterns with mixed separators on Windows', () => {
    if (!IS_WINDOWS) {
      return
    }

    // Pattern might be specified with forward slashes by user
    const pattern = new Pattern('C:/Users/*/file.txt')
    
    // But the actual path from filesystem will have backslashes
    expect(pattern.match('C:\\Users\\test\\file.txt')).toBe(MatchKind.All)
  })

  it('handles complex patterns with backslashes on Windows', () => {
    if (!IS_WINDOWS) {
      return
    }

    const currentDrive = process.cwd().substring(0, 2)
    const pattern = new Pattern(`${currentDrive}\\**\\*.txt`)
    
    // Should match .txt files at any depth
    expect(pattern.match(`${currentDrive}\\file.txt`)).toBe(MatchKind.All)
    expect(pattern.match(`${currentDrive}\\foo\\bar\\test.txt`)).toBe(MatchKind.All)
    expect(pattern.match(`${currentDrive}\\foo\\bar\\test.js`)).toBe(MatchKind.None)
  })
})
