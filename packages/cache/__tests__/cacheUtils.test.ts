import * as io from '@actions/io'
import {promises as fs} from 'fs'
import * as path from 'path'
import * as cacheUtils from '../src/internal/cacheUtils'

jest.mock('@actions/core')
jest.mock('os')

function getTempDir(): string {
  return path.join(__dirname, '_temp', 'cacheUtils')
}

afterAll(async () => {
  delete process.env['GITHUB_WORKSPACE']
  await io.rmRF(getTempDir())
})

test('getArchiveFileSize returns file size', () => {
  const filePath = path.join(__dirname, '__fixtures__', 'helloWorld.txt')

  const size = cacheUtils.getArchiveFileSize(filePath)

  expect(size).toBe(11)
})

test('unlinkFile unlinks file', async () => {
  const testDirectory = await fs.mkdtemp('unlinkFileTest')
  const testFile = path.join(testDirectory, 'test.txt')
  await fs.writeFile(testFile, 'hello world')

  await cacheUtils.unlinkFile(testFile)

  // This should throw as testFile should not exist
  await expect(fs.stat(testFile)).rejects.toThrow()

  await fs.rmdir(testDirectory)
})
