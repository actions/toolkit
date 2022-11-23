import {exec} from '@actions/exec'
import * as io from '@actions/io'
import {existsSync, writeFileSync} from 'fs'
import * as path from 'path'
import * as utils from './cacheUtils'
import {CompressionMethod, SystemTarPathOnWindows} from './constants'

const IS_WINDOWS = process.platform === 'win32'

// Function also mutates the args array. For non-mutation call with passing an empty array.
async function getTarPath(): Promise<string> {
  switch (process.platform) {
    case 'win32': {
      const gnuTar = await utils.getGnuTarPathOnWindows()
      const systemTar = SystemTarPathOnWindows
      if (gnuTar) {
        // Use GNUtar as default on windows
        return gnuTar
      } else if (existsSync(systemTar)) {
        return systemTar
      }
      break
    }
    case 'darwin': {
      const gnuTar = await io.which('gtar', false)
      if (gnuTar) {
        // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
        return gnuTar
      }
      break
    }
    default:
      break
  }
  return await io.which('tar', true)
}

async function getTarArgs(
  compressionMethod: CompressionMethod,
  type: string,
  archivePath = ''
): Promise<string[]> {
  const args = []
  const manifestFilename = 'manifest.txt'
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const tarFile = 'cache.tar'
  const tarPath = await getTarPath()
  const workingDirectory = getWorkingDirectory()
  const BSD_TAR_ZSTD =
    tarPath === SystemTarPathOnWindows &&
    compressionMethod !== CompressionMethod.Gzip

  // Method specific args
  switch (type) {
    case 'create':
      args.push(
        '--posix',
        '-cf',
        BSD_TAR_ZSTD
          ? tarFile
          : cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '--exclude',
        BSD_TAR_ZSTD
          ? tarFile
          : cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P',
        '-C',
        workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '--files-from',
        manifestFilename
      )
      break
    case 'extract':
      args.push(
        '-xf',
        BSD_TAR_ZSTD
          ? tarFile
          : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P',
        '-C',
        workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
      )
      break
    case 'list':
      args.push(
        '-tf',
        BSD_TAR_ZSTD
          ? tarFile
          : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P'
      )
      break
  }

  // Platform specific args
  switch (process.platform) {
    case 'win32': {
      const gnuTar = await utils.getGnuTarPathOnWindows()
      if (gnuTar) {
        // Use GNUtar as default on windows
        args.push('--force-local')
      }
      break
    }
    case 'darwin': {
      const gnuTar = await io.which('gtar', false)
      if (gnuTar) {
        // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
        args.push('--delay-directory-restore')
      }
      break
    }
  }

  return args
}

async function execTar(args: string[], cwd?: string): Promise<void> {
  try {
    await exec(`"${await getTarPath()}"`, args, {cwd})
  } catch (error) {
    throw new Error(`Tar failed with error: ${error?.message}`)
  }
}

async function execCommand(
  command: string,
  args: string[],
  cwd?: string
): Promise<void> {
  try {
    await exec(command, args, {cwd})
  } catch (error) {
    throw new Error(`Tar failed with error: ${error?.message}`)
  }
}

function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
}

// Common function for extractTar and listTar to get the compression method
async function getCompressionProgram(
  compressionMethod: CompressionMethod,
  archivePath: string
): Promise<string[]> {
  // -d: Decompress.
  // unzstd is equivalent to 'zstd -d'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  const tarPath = await getTarPath()
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const tarFile = 'cache.tar'
  const BSD_TAR_ZSTD =
    tarPath === SystemTarPathOnWindows &&
    compressionMethod !== CompressionMethod.Gzip
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --long=30 -o',
            tarFile,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '&&'
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? 'zstd -d --long=30' : 'unzstd --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d -o',
            tarFile,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '&&'
          ]
        : ['--use-compress-program', IS_WINDOWS ? 'zstd -d' : 'unzstd']
    default:
      return ['-z']
  }
}

export async function listTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  const tarPath = await getTarPath()
  const BSD_TAR_ZSTD =
    tarPath === SystemTarPathOnWindows &&
    compressionMethod !== CompressionMethod.Gzip
  const compressionArgs = await getCompressionProgram(
    compressionMethod,
    archivePath
  )
  const tarArgs = await getTarArgs(compressionMethod, 'list', archivePath)
  // TODO: Add a test for BSD tar on windows
  if (BSD_TAR_ZSTD) {
    const command = compressionArgs[0]
    const args = compressionArgs
      .slice(1)
      .concat([tarPath])
      .concat(tarArgs)
    await execCommand(command, args)
  } else {
    const args = tarArgs.concat(compressionArgs)
    await execTar(args)
  }
}

export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // Create directory to extract tar into
  const workingDirectory = getWorkingDirectory()
  const tarPath = await getTarPath()
  const BSD_TAR_ZSTD =
    tarPath === SystemTarPathOnWindows &&
    compressionMethod !== CompressionMethod.Gzip
  await io.mkdirP(workingDirectory)
  const tarArgs = await getTarArgs(compressionMethod, 'extract', archivePath)
  const compressionArgs = await getCompressionProgram(
    compressionMethod,
    archivePath
  )
  if (BSD_TAR_ZSTD) {
    const command = compressionArgs[0]
    const args = compressionArgs
      .slice(1)
      .concat([tarPath])
      .concat(tarArgs)
    await execCommand(command, args)
  } else {
    const args = tarArgs.concat(compressionArgs)
    await execTar(args)
  }
}

export async function createTar(
  archiveFolder: string,
  sourceDirectories: string[],
  compressionMethod: CompressionMethod
): Promise<void> {
  // Write source directories to manifest.txt to avoid command length limits
  const manifestFilename = 'manifest.txt'
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const tarFile = 'cache.tar'
  const tarPath = await getTarPath()
  const BSD_TAR_ZSTD =
    tarPath === SystemTarPathOnWindows &&
    compressionMethod !== CompressionMethod.Gzip
  writeFileSync(
    path.join(archiveFolder, manifestFilename),
    sourceDirectories.join('\n')
  )

  // -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
  // zstdmt is equivalent to 'zstd -T0'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  // Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
  function getCompressionProgram(): string[] {
    switch (compressionMethod) {
      case CompressionMethod.Zstd:
        return BSD_TAR_ZSTD
          ? [
              '&&',
              'zstd -T0 --long=30 -o',
              cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
              tarFile
            ]
          : [
              '--use-compress-program',
              IS_WINDOWS ? 'zstd -T0 --long=30' : 'zstdmt --long=30'
            ]
      case CompressionMethod.ZstdWithoutLong:
        return BSD_TAR_ZSTD
          ? [
              '&&',
              'zstd -T0 -o',
              cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
              tarFile
            ]
          : ['--use-compress-program', IS_WINDOWS ? 'zstd -T0' : 'zstdmt']
      default:
        return ['-z']
    }
  }
  const tarArgs = await getTarArgs(compressionMethod, 'create')
  const compressionArgs = getCompressionProgram()
  const args = tarArgs.concat(compressionArgs)
  await execTar(args, archiveFolder)
}
