import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as path from 'path'
import {
  CacheFilename,
  CompressionMethod,
  GnuTarPathOnWindows,
  SystemTarPathOnWindows
} from '../src/internal/constants'
import * as tar from '../src/internal/tar'
import * as utils from '../src/internal/cacheUtils'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import fs = require('fs')

jest.mock('@actions/exec')
jest.mock('@actions/io')

const IS_WINDOWS = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'

const defaultTarPath = IS_MAC ? 'gtar' : 'tar'

function getTempDir(): string {
  return path.join(__dirname, '_temp', 'tar')
}

beforeAll(async () => {
  jest.spyOn(io, 'which').mockImplementation(async tool => {
    return tool
  })

  process.env['GITHUB_WORKSPACE'] = process.cwd()
  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

beforeEach(async () => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  delete process.env['GITHUB_WORKSPACE']
  await jest.requireActual('@actions/io').rmRF(getTempDir())
})

test('zstd extract tar', async () => {
  const mkdirMock = jest.spyOn(io, 'mkdirP')
  const execMock = jest.spyOn(exec, 'exec')

  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'
  const workspace = process.env['GITHUB_WORKSPACE']
  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath

  await tar.extractTar(archivePath, CompressionMethod.Zstd)

  expect(mkdirMock).toHaveBeenCalledWith(workspace)
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '-xf',
      IS_WINDOWS ? archivePath.replace(/\\/g, '/') : archivePath,
      '-P',
      '-C',
      IS_WINDOWS ? workspace?.replace(/\\/g, '/') : workspace
    ]
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat([
        '--use-compress-program',
        IS_WINDOWS ? 'zstd -d --long=30' : 'unzstd --long=30'
      ]),
    {cwd: undefined}
  )
})

test('zstd extract tar with windows BSDtar', async () => {
  if (IS_WINDOWS) {
    const mkdirMock = jest.spyOn(io, 'mkdirP')
    const execMock = jest.spyOn(exec, 'exec')
    jest
      .spyOn(utils, 'getGnuTarPathOnWindows')
      .mockReturnValue(Promise.resolve(''))

    const archivePath = `${process.env['windir']}\\fakepath\\cache.tar`
    const workspace = process.env['GITHUB_WORKSPACE']
    const tarPath = SystemTarPathOnWindows
    const tarFilename = 'cache.tar'

    await tar.extractTar(archivePath, CompressionMethod.Zstd)

    expect(mkdirMock).toHaveBeenCalledWith(workspace)
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(
      'zstd -d --long=30 -o',
      [
        tarFilename.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '&&',
        `"${tarPath}"`,
        '-xf',
        tarFilename.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P',
        '-C',
        workspace?.replace(/\\/g, '/')
      ],
      {cwd: undefined}
    )
  }
})

test('gzip extract tar', async () => {
  const mkdirMock = jest.spyOn(io, 'mkdirP')
  const execMock = jest.spyOn(exec, 'exec')
  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'
  const workspace = process.env['GITHUB_WORKSPACE']

  await tar.extractTar(archivePath, CompressionMethod.Gzip)

  expect(mkdirMock).toHaveBeenCalledWith(workspace)
  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '-xf',
      IS_WINDOWS ? archivePath.replace(/\\/g, '/') : archivePath,
      '-P',
      '-C',
      IS_WINDOWS ? workspace?.replace(/\\/g, '/') : workspace
    ]
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat(['-z']),
    {cwd: undefined}
  )
})

test('gzip extract GNU tar on windows with GNUtar in path', async () => {
  if (IS_WINDOWS) {
    // GNU tar present in path but not at default location
    jest
      .spyOn(utils, 'getGnuTarPathOnWindows')
      .mockReturnValue(Promise.resolve('tar'))
    const execMock = jest.spyOn(exec, 'exec')
    const archivePath = `${process.env['windir']}\\fakepath\\cache.tar`
    const workspace = process.env['GITHUB_WORKSPACE']

    await tar.extractTar(archivePath, CompressionMethod.Gzip)

    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(
      `"tar"`,
      [
        '-xf',
        archivePath.replace(/\\/g, '/'),
        '-P',
        '-C',
        workspace?.replace(/\\/g, '/'),
        '--force-local',
        '-z'
      ],
      {cwd: undefined}
    )
  }
})

test('zstd create tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archiveFolder = getTempDir()
  const workspace = process.env['GITHUB_WORKSPACE']
  const sourceDirectories = ['~/.npm/cache', `${workspace}/dist`]

  await fs.promises.mkdir(archiveFolder, {recursive: true})

  await tar.createTar(archiveFolder, sourceDirectories, CompressionMethod.Zstd)

  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '--posix',
      '-cf',
      IS_WINDOWS ? CacheFilename.Zstd.replace(/\\/g, '/') : CacheFilename.Zstd,
      '--exclude',
      IS_WINDOWS ? CacheFilename.Zstd.replace(/\\/g, '/') : CacheFilename.Zstd,
      '-P',
      '-C',
      IS_WINDOWS ? workspace?.replace(/\\/g, '/') : workspace,
      '--files-from',
      'manifest.txt'
    ]
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat([
        '--use-compress-program',
        IS_WINDOWS ? 'zstd -T0 --long=30' : 'zstdmt --long=30'
      ]),
    {
      cwd: archiveFolder
    }
  )
})

test('zstd create tar with windows BSDtar', async () => {
  if (IS_WINDOWS) {
    const execMock = jest.spyOn(exec, 'exec')
    jest
      .spyOn(utils, 'getGnuTarPathOnWindows')
      .mockReturnValue(Promise.resolve(''))

    const archiveFolder = getTempDir()
    const workspace = process.env['GITHUB_WORKSPACE']
    const sourceDirectories = ['~/.npm/cache', `${workspace}/dist`]
    const tarFilename = 'cache.tar'

    await fs.promises.mkdir(archiveFolder, {recursive: true})

    await tar.createTar(
      archiveFolder,
      sourceDirectories,
      CompressionMethod.Zstd
    )

    const tarPath = SystemTarPathOnWindows

    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(
      `"${tarPath}"`,
      [
        '--posix',
        '-cf',
        tarFilename.replace(/\\/g, '/'),
        '--exclude',
        tarFilename.replace(/\\/g, '/'),
        '-P',
        '-C',
        workspace?.replace(/\\/g, '/'),
        '--files-from',
        'manifest.txt',
        '&&',
        'zstd -T0 --long=30 -o',
        CacheFilename.Zstd.replace(/\\/g, '/'),
        tarFilename.replace(/\\/g, '/')
      ],
      {
        cwd: archiveFolder
      }
    )
  }
})

test('gzip create tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archiveFolder = getTempDir()
  const workspace = process.env['GITHUB_WORKSPACE']
  const sourceDirectories = ['~/.npm/cache', `${workspace}/dist`]

  await fs.promises.mkdir(archiveFolder, {recursive: true})

  await tar.createTar(archiveFolder, sourceDirectories, CompressionMethod.Gzip)

  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    [
      '--posix',
      '-cf',
      IS_WINDOWS ? CacheFilename.Gzip.replace(/\\/g, '/') : CacheFilename.Gzip,
      '--exclude',
      IS_WINDOWS ? CacheFilename.Gzip.replace(/\\/g, '/') : CacheFilename.Gzip,
      '-P',
      '-C',
      IS_WINDOWS ? workspace?.replace(/\\/g, '/') : workspace,
      '--files-from',
      'manifest.txt'
    ]
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat(['-z']),
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

  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    ['-tf', IS_WINDOWS ? archivePath.replace(/\\/g, '/') : archivePath, '-P']
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat([
        '--use-compress-program',
        IS_WINDOWS ? 'zstd -d --long=30' : 'unzstd --long=30'
      ]),
    {cwd: undefined}
  )
})

test('zstd list tar with windows BSDtar', async () => {
  if (IS_WINDOWS) {
    const execMock = jest.spyOn(exec, 'exec')
    jest
      .spyOn(utils, 'getGnuTarPathOnWindows')
      .mockReturnValue(Promise.resolve(''))
    const archivePath = `${process.env['windir']}\\fakepath\\cache.tar`

    await tar.listTar(archivePath, CompressionMethod.Zstd)

    const tarFilename = 'cache.tar'
    const tarPath = SystemTarPathOnWindows
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(execMock).toHaveBeenCalledWith(
      'zstd -d --long=30 -o',
      [
        tarFilename.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '&&',
        `"${tarPath}"`,
        '-tf',
        tarFilename.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P'
      ],
      {cwd: undefined}
    )
  }
})

test('zstdWithoutLong list tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')

  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'

  await tar.listTar(archivePath, CompressionMethod.ZstdWithoutLong)

  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    ['-tf', IS_WINDOWS ? archivePath.replace(/\\/g, '/') : archivePath, '-P']
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat(['--use-compress-program', IS_WINDOWS ? 'zstd -d' : 'unzstd']),
    {cwd: undefined}
  )
})

test('gzip list tar', async () => {
  const execMock = jest.spyOn(exec, 'exec')
  const archivePath = IS_WINDOWS
    ? `${process.env['windir']}\\fakepath\\cache.tar`
    : 'cache.tar'

  await tar.listTar(archivePath, CompressionMethod.Gzip)

  const tarPath = IS_WINDOWS ? GnuTarPathOnWindows : defaultTarPath
  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock).toHaveBeenCalledWith(
    `"${tarPath}"`,
    ['-tf', IS_WINDOWS ? archivePath.replace(/\\/g, '/') : archivePath, '-P']
      .concat(IS_WINDOWS ? ['--force-local'] : [])
      .concat(IS_MAC ? ['--delay-directory-restore'] : [])
      .concat(['-z']),
    {cwd: undefined}
  )
})
