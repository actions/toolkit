import {exec} from '@actions/exec'
import * as io from '@actions/io'
import {existsSync, writeFileSync} from 'fs'
import * as path from 'path'
import * as utils from './cacheUtils'
import {CompressionMethod, GnuTarPathOnWindows, SystemTarPathOnWindows} from './constants'

const IS_WINDOWS = process.platform === 'win32'

// Function also mutates the args array. For non-mutation call with passing an empty array.
async function getTarPath(args: string[]): Promise<string> {
  switch (process.platform) {
    case 'win32': {
      const gnuTar = await utils.getGnuTarPathOnWindows()
      const systemTar = `${process.env['windir']}\\System32\\tar.exe`
      if (gnuTar) {
        // Use GNUtar as default on windows
        if (args.length > 0) {
          args.push('--force-local') 
        }
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
        if (args.length > 0) {
          args.push('--delay-directory-restore')
        }
        return gnuTar
      }
      break
    }
    default:
      break
  }
  return await io.which('tar', true)
}

async function execTar(args: string[], cwd?: string): Promise<void> {
  try {
    await exec(`"${await getTarPath(args)}"`, args, {cwd})
  } catch (error) {
    throw new Error(`Tar failed with error: ${error?.message}`)
  }
}

function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
}

// Common function for extractTar and listTar to get the compression method
async function getCompressionProgram(compressionMethod: CompressionMethod): Promise<string[]> {
  // -d: Decompress.
  // unzstd is equivalent to 'zstd -d'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  const tarPath = await getTarPath([])
  const BSD_TAR_ZSTD = IS_WINDOWS && tarPath === SystemTarPathOnWindows
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      if (BSD_TAR_ZSTD) {
        return ['-a'] // auto-detect compression
      }
      return [
        '--use-compress-program',
        IS_WINDOWS ? 'zstd -d --long=30' : 'unzstd --long=30'
      ]
    case CompressionMethod.ZstdWithoutLong:
      if (BSD_TAR_ZSTD) {
        return ['a'] // auto-detect compression
      }
      return ['--use-compress-program', IS_WINDOWS ? 'zstd -d' : 'unzstd']
    default:
      return ['-z']
  }
}

export async function listTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  const args = [
    '-tf',
    ...(await getCompressionProgram(compressionMethod)),
    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P'
  ]
  await execTar(args)
}

export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // Create directory to extract tar into
  const workingDirectory = getWorkingDirectory()
  await io.mkdirP(workingDirectory)
  const args = [
    '-xf',
    ...(await getCompressionProgram(compressionMethod)),
    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P',
    '-C',
    workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
  ]
  await execTar(args)
}

export async function createTar(
  archiveFolder: string,
  sourceDirectories: string[],
  compressionMethod: CompressionMethod
): Promise<void> {
  // Write source directories to manifest.txt to avoid command length limits
  const manifestFilename = 'manifest.txt'
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  writeFileSync(
    path.join(archiveFolder, manifestFilename),
    sourceDirectories.join('\n')
  )
  const workingDirectory = getWorkingDirectory()

  // -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
  // zstdmt is equivalent to 'zstd -T0'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  // Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
  async function getCompressionProgram(): Promise<string[]> {
    const tarPath = await getTarPath([])
    const BSD_TAR_ZSTD = IS_WINDOWS && tarPath === SystemTarPathOnWindows
    switch (compressionMethod) {
      case CompressionMethod.Zstd:
        if (BSD_TAR_ZSTD) {
          return [
            '-O', '|', 'zstd -T0 --long=30 -o'
          ]
        }
        return [
          '--use-compress-program',
          IS_WINDOWS ? 'zstd -T0 --long=30' : 'zstdmt --long=30'
        ]
      case CompressionMethod.ZstdWithoutLong:
        if (BSD_TAR_ZSTD) {
          return [
            '-O', '|', 'zstd -T0 -o'
          ]
        }
        return ['--use-compress-program', IS_WINDOWS ? 'zstd -T0' : 'zstdmt']
      default:
        return ['-z']
    }
  }
  const args = [
    '--posix',
    '--exclude',
    cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P',
    '-C',
    workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '--files-from',
    manifestFilename,
    '-cf',
    ...(await getCompressionProgram()),
    cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),

  ]
  await execTar(args, archiveFolder)
}
