import {promises as fs} from 'fs'
import * as path from 'path'
import * as cacheUtils from '../src/internal/cacheUtils'

test('getArchiveFileSizeIsBytes returns file size', () => {
  const filePath = path.join(__dirname, '__fixtures__', 'helloWorld.txt')

  const size = cacheUtils.getArchiveFileSizeIsBytes(filePath)

  expect(size).toBe(11)
})

test('unlinkFile unlinks file', async () => {
  const testDirectory = await fs.mkdtemp('unlinkFileTest')
  const testFile = path.join(testDirectory, 'test.txt')
  await fs.writeFile(testFile, 'hello world')

  await expect(fs.stat(testFile)).resolves.not.toThrow()

  await cacheUtils.unlinkFile(testFile)

  // This should throw as testFile should not exist
  await expect(fs.stat(testFile)).rejects.toThrow()

  await fs.rmdir(testDirectory)
})
