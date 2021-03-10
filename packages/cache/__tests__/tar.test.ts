import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as path from 'path'
import {CacheFilename, CompressionMethod} from '../src/internal/constants'
import * as tar from '../src/internal/tar'
import * as utils from '../src/internal/cacheUtils'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import fs = require('fs')

jest.mock('@actions/exec')
jest.mock('@actions/io')

const IS_WINDOWS = process.platform === 'win32'

const defaultTarPath = process.platform === 'darwin' ? 'gtar' : 'tar'

function getTempDir(): string {
  return path.join(__dirname, '_temp', 'tar')
}

beforeAll(async () => {
  jest.spyOn(io, 'which').mockImplementation(async tool => {
    return tool
  })

  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

afterAll(async () => {
  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

test('zstd extract tar', async () => {
  const mkdirMock = jest.spyOn(io, 'mkdirP')
  const execMock = jest.spyOn(exec, 'exec')

  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'
  const workspace = process.cwd()

  await tar.extractTar(archivePath, CompressionMethod.Zstd)

  expect(mkdirMock).toHaveBeenCalledWith(workspace)
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${defaultTarPath}"`,
    [
      '--use-compress-program',
      'zstd -d --long=30',
      '-xf',
      path.normalize(archivePath),
      '-P',
      '-C',
      path.normalize(workspace)
    ].concat(IS_WINDOWS ? ['--force-local'] : []),
    {cwd: undefined}
  )
})

test('gzip extract tar', async () => {
  const mkdirMock = jest.spyOn(io, 'mkdirP')
  const execMock = jest.spyOn(exec, 'exec')
  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'
  const workspace = process.cwd()

  await tar.extractTar(archivePath, CompressionMethod.Gzip)

  expect(mkdirMock).toHaveBeenCalledWith(workspace)
  const tarPath = IS_WINDOWS
    ? `${process.env['windir']}\\System32\\tar.exe`
    : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '-z',
      '-xf',
      path.normalize(archivePath),
      '-P',
      '-C',
      path.normalize(workspace)
    ],
    {cwd: undefined}
  )
})

test('gzip extract GNU tar on windows', async () => {
  if (IS_WINDOWS) {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)

    const isGnuMock = jest
      .spyOn(utils, 'isGnuTarInstalled')
      .mockReturnValue(Promise.resolve(true))
    const execMock = jest.spyOn(exec, 'exec')
    const archivePath = `${process.env['windir']}\\fakepath\\cache.tar`
    const workspace = process.cwd()

    await tar.extractTar(archivePath, CompressionMethod.Gzip)

    expect(isGnuMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(
      `"tar"`,
      [
        '-z',
        '-xf',
        path.normalize(archivePath),
        '-P',
        '-C',
        path.normalize(workspace),
        '--force-local'
      ],
      {cwd: undefined}
    )
  }
})

test('zstd create tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archiveFolder = getTempDir()
  const workspace = process.cwd()
  const sourceDirectories = ['~/.npm/cache', `${workspace}/dist`]

  await fs.promises.mkdir(archiveFolder, {recursive: true})

  await tar.createTar(archiveFolder, sourceDirectories, CompressionMethod.Zstd)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${defaultTarPath}"`,
    [
      '--posix',
      '--use-compress-program',
      'zstd -T0 --long=30',
      '-cf',
      path.normalize(CacheFilename.Zstd),
      '-P',
      '-C',
      path.normalize(workspace),
      '--files-from',
      'manifest.txt'
    ].concat(IS_WINDOWS ? ['--force-local'] : []),
    {
      cwd: archiveFolder
    }
  )
})

test('gzip create tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archiveFolder = getTempDir()
  const workspace = process.cwd()
  const sourceDirectories = ['~/.npm/cache', `${workspace}/dist`]

  await fs.promises.mkdir(archiveFolder, {recursive: true})

  await tar.createTar(archiveFolder, sourceDirectories, CompressionMethod.Gzip)

  const tarPath = IS_WINDOWS
    ? `${process.env['windir']}\\System32\\tar.exe`
    : defaultTarPath

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '--posix',
      '-z',
      '-cf',
      path.normalize(CacheFilename.Gzip),
      '-P',
      '-C',
      path.normalize(workspace),
      '--files-from',
      'manifest.txt'
    ],
    {
      cwd: archiveFolder
    }
  )
})

test('zstd list tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'

  await tar.listTar(archivePath, CompressionMethod.Zstd)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${defaultTarPath}"`,
    [
      '--use-compress-program',
      'zstd -d --long=30',
      '-tf',
      path.normalize(archivePath),
      '-P'
    ].concat(IS_WINDOWS ? ['--force-local'] : []),
    {cwd: undefined}
  )
})

test('zstdWithoutLong list tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'

  await tar.listTar(archivePath, CompressionMethod.ZstdWithoutLong)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${defaultTarPath}"`,
    [
      '--use-compress-program',
      'zstd -d',
      '-tf',
      path.normalize(archivePath),
      '-P'
    ].concat(IS_WINDOWS ? ['--force-local'] : []),
    {cwd: undefined}
  )
})

test('gzip list tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')
  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'

  await tar.listTar(archivePath, CompressionMethod.Gzip)

  const tarPath = IS_WINDOWS
    ? `${process.env['windir']}\\System32\\tar.exe`
    : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    ['-z', '-tf', path.normalize(archivePath), '-P'],
    {cwd: undefined}
  )
})
