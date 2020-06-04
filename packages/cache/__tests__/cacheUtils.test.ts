import {promises as fs} from 'fs'
import * as path from 'path'
import * as cacheUtils from '../src/internal/cacheUtils'
import * as execUtils from '../src/internal/execUtils'

jest.mock('../src/internal/execUtils')

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

test('getAzCopyCommand returns undefined if azcopy not installed', async () => {
  jest.spyOn(execUtils, 'getVersion').mockImplementation(async (app) => '')
  expect(await cacheUtils.getAzCopyCommand()).toBeUndefined()
})

test('getAzCopyCommand returns azcopy10 when available', async () => {
  jest.spyOn(execUtils, 'getVersion').mockImplementation(async (app) => {
    if (app == 'azcopy') {
      return 'azcopy version 10.4.3'
    } else {
      return ''
    }
  })
  expect(await cacheUtils.getAzCopyCommand()).toBe('azcopy')
})

test('getAzCopyCommand returns azcopy10 when available', async () => {
  jest.spyOn(execUtils, 'getVersion').mockImplementation(async (app) => {
    if (app == 'azcopy') {
      return 'azcopy version 7.3.0'
    } else if (app == 'azcopy10') {
      return 'azcopy version 10.4.3'
    } else {
      return ''
    }
  })
  expect(await cacheUtils.getAzCopyCommand()).toBe('azcopy10')
})

test('getAzCopyCommand returns latest version of azcopy', async () => {
  jest.spyOn(execUtils, 'getVersion').mockImplementation(async (app) => {
    if (app == 'azcopy') {
      return 'azcopy version 10.4.4'
    } else if (app == 'azcopy10') {
      return 'azcopy version 10.4.3'
    } else {
      return ''
    }
  })
  expect(await cacheUtils.getAzCopyCommand()).toBe('azcopy')
})