import * as path from 'path'
import {DefaultGlobber} from '../src/internal-globber.js'

const mockRoot = path.resolve('large-directory')
const mockChildren = Array.from(
  {length: 200000},
  (_, index) => `file-${index}.txt`
)

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs')
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readdir: jest.fn(async () => mockChildren),
      lstat: jest.fn(async (filePath: string) => ({
        isDirectory: () => filePath === mockRoot,
        isSymbolicLink: () => false
      }))
    }
  }
})

describe('large directory traversal', () => {
  it.each(['glob', 'globGenerator'] as const)(
    '%s handles 200,000 entries in directory order',
    async method => {
      const globber = await DefaultGlobber.create(
        path.join(mockRoot, '*.txt'),
        {followSymbolicLinks: false, implicitDescendants: false}
      )
      let matches: string[]
      if (method === 'glob') {
        matches = await globber.glob()
      } else {
        matches = []
        for await (const match of globber.globGenerator()) {
          matches.push(match)
        }
      }

      expect(matches).toEqual(
        mockChildren.map(name => path.join(mockRoot, name))
      )
    }
  )
})
