import * as core from '@actions/core'
import * as io from '@actions/io'
import {promises as fs} from 'fs'
import * as os from 'os'
import * as path from 'path'
import {v4 as uuidV4} from 'uuid'
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

test('logWarning logs a message with a warning prefix', () => {
  const message = 'A warning occurred.'

  const infoMock = jest.spyOn(core, 'info')

  cacheUtils.logWarning(message)

  expect(infoMock).toHaveBeenCalledWith(`[warning]${message}`)
})

test('resolvePaths with no ~ in path', async () => {
  const filePath = '.cache'

  // Create the following layout:
  //   cwd
  //   cwd/.cache
  //   cwd/.cache/file.txt

  const root = path.join(getTempDir(), 'no-tilde')
  // tarball entries will be relative to workspace
  process.env['GITHUB_WORKSPACE'] = root

  await fs.mkdir(root, {recursive: true})
  const cache = path.join(root, '.cache')
  await fs.mkdir(cache, {recursive: true})
  await fs.writeFile(path.join(cache, 'file.txt'), 'cached')

  const originalCwd = process.cwd()

  try {
    process.chdir(root)

    const resolvedPath = await cacheUtils.resolvePaths([filePath])

    const expectedPath = [filePath]
    expect(resolvedPath).toStrictEqual(expectedPath)
  } finally {
    process.chdir(originalCwd)
  }
})

test('resolvePaths with ~ in path', async () => {
  const cacheDir = uuidV4()
  const filePath = `~/${cacheDir}`
  // Create the following layout:
  //   ~/uuid
  //   ~/uuid/file.txt

  const homedir = jest.requireActual('os').homedir()
  const homedirMock = jest.spyOn(os, 'homedir')
  homedirMock.mockReturnValue(homedir)

  const target = path.join(homedir, cacheDir)
  await fs.mkdir(target, {recursive: true})
  await fs.writeFile(path.join(target, 'file.txt'), 'cached')

  const root = getTempDir()
  process.env['GITHUB_WORKSPACE'] = root

  try {
    const resolvedPath = await cacheUtils.resolvePaths([filePath])

    const expectedPath = [path.relative(root, target)]
    expect(resolvedPath).toStrictEqual(expectedPath)
  } finally {
    await io.rmRF(target)
  }
})

test('resolvePaths with home not found', async () => {
  const filePath = '~/.cache/yarn'
  const homedirMock = jest.spyOn(os, 'homedir')
  homedirMock.mockReturnValue('')

  await expect(cacheUtils.resolvePaths([filePath])).rejects.toThrow(
    'Unable to determine HOME directory'
  )
})

test('resolvePaths inclusion pattern returns found', async () => {
  const pattern = '*.ts'
  // Create the following layout:
  //   inclusion-patterns
  //   inclusion-patterns/miss.txt
  //   inclusion-patterns/test.ts

  const root = path.join(getTempDir(), 'inclusion-patterns')
  // tarball entries will be relative to workspace
  process.env['GITHUB_WORKSPACE'] = root

  await fs.mkdir(root, {recursive: true})
  await fs.writeFile(path.join(root, 'miss.txt'), 'no match')
  await fs.writeFile(path.join(root, 'test.ts'), 'match')

  const originalCwd = process.cwd()

  try {
    process.chdir(root)

    const resolvedPath = await cacheUtils.resolvePaths([pattern])

    const expectedPath = ['test.ts']
    expect(resolvedPath).toStrictEqual(expectedPath)
  } finally {
    process.chdir(originalCwd)
  }
})

test('resolvePaths exclusion pattern returns not found', async () => {
  const patterns = ['*.ts', '!test.ts']
  // Create the following layout:
  //   exclusion-patterns
  //   exclusion-patterns/miss.txt
  //   exclusion-patterns/test.ts

  const root = path.join(getTempDir(), 'exclusion-patterns')
  // tarball entries will be relative to workspace
  process.env['GITHUB_WORKSPACE'] = root

  await fs.mkdir(root, {recursive: true})
  await fs.writeFile(path.join(root, 'miss.txt'), 'no match')
  await fs.writeFile(path.join(root, 'test.ts'), 'no match')

  const originalCwd = process.cwd()

  try {
    process.chdir(root)

    const resolvedPath = await cacheUtils.resolvePaths(patterns)

    const expectedPath: string[] = []
    expect(resolvedPath).toStrictEqual(expectedPath)
  } finally {
    process.chdir(originalCwd)
  }
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
