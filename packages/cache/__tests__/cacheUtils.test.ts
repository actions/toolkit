import {promises as fs} from 'fs'
import * as path from 'path'
import * as cacheUtils from '../src/internal/cacheUtils'

test('getArchiveFileSizeInBytes returns file size', () => {
  const filePath = path.join(__dirname, '__fixtures__', 'helloWorld.txt')

  const size = cacheUtils.getArchiveFileSizeInBytes(filePath)

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

test('assertDefined throws if undefined', () => {
  expect(() => cacheUtils.assertDefined('test', undefined)).toThrowError()
})

test('assertDefined returns value', () => {
  expect(cacheUtils.assertDefined('test', 5)).toBe(5)
})

test('isFeatureAvailable returns true if server url is set', () => {
  try {
      process.env['ACTIONS_CACHE_URL'] = 'http://cache.com'
      expect(cacheUtils.isFeatureAvailable()).toBe(true)
  } finally {
     delete process.env['ACTIONS_CACHE_URL']
  }
})

test('isFeatureAvailable returns false if server url is not set', () => {
  expect(cacheUtils.isFeatureAvailable()).toBe(false)
})

