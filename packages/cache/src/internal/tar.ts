import {exec} from '@actions/exec'
import * as io from '@actions/io'
import {existsSync, writeFileSync} from 'fs'
import * as path from 'path'
import * as utils from './cacheUtils'
import {CompressionMethod} from './constants'

async function getTarPath(
  args: string[],
  compressionMethod: CompressionMethod
): Promise<string> {
  const IS_WINDOWS = process.platform === 'win32'
  switch (process.platform) {
    case 'win32': {
      const systemTar = `${process.env['windir']}\\System32\\tar.exe`
      if (compressionMethod !== CompressionMethod.Gzip) {
        // We only use zstandard compression on windows when gnu tar is installed due to
        // a bug with compressing large files with bsdtar + zstd
        args.push('--force-local')
      } else if (existsSync(systemTar)) {
        return systemTar
      } else if (await utils.isGnuTarInstalled()) {
        args.push('--force-local')
      }
      break
    }
    case 'darwin': {
      const gnuTar = await io.which('gtar', false)
      if (gnuTar) {
        return gnuTar
      }
      break
    }
    default: break
  }
  return await io.which('tar', true)
}

async function execTar(
  args: string[],
  compressionMethod: CompressionMethod,
  cwd?: string
): Promise<void> {
  try {
    await exec(`"${await getTarPath(args, compressionMethod)}"`, args, {cwd})
  } catch (error) {
    throw new Error(`Tar failed with error: ${error?.message}`)
  }
}

function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
}

export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // Create directory to extract tar into
  const workingDirectory = getWorkingDirectory()
  await io.mkdirP(workingDirectory)
  // --d: Decompress.
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  function getCompressionProgram(): string[] {
    switch (compressionMethod) {
      case CompressionMethod.Zstd:
        return ['--use-compress-program', 'zstd -d --long=30']
      case CompressionMethod.ZstdWithoutLong:
        return ['--use-compress-program', 'zstd -d']
      default:
        return ['-z']
    }
  }
  const args = [
    ...getCompressionProgram(),
    '-xf',
    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P',
    '-C',
    workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
  ]
  await execTar(args, compressionMethod)
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
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  // Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
  function getCompressionProgram(): string[] {
    switch (compressionMethod) {
      case CompressionMethod.Zstd:
        return ['--use-compress-program', 'zstd -T0 --long=30']
      case CompressionMethod.ZstdWithoutLong:
        return ['--use-compress-program', 'zstd -T0']
      default:
        return ['-z']
    }
  }
  const args = [
    '--posix',
    ...getCompressionProgram(),
    '-cf',
    cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P',
    '-C',
    workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '--files-from',
    manifestFilename
  ]
  await execTar(args, compressionMethod, archiveFolder)
}

export async function listTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // --d: Decompress.
  // --long=#: Enables long distance matching with # bits.
  // Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  function getCompressionProgram(): string[] {
    switch (compressionMethod) {
      case CompressionMethod.Zstd:
        return ['--use-compress-program', 'zstd -d --long=30']
      case CompressionMethod.ZstdWithoutLong:
        return ['--use-compress-program', 'zstd -d']
      default:
        return ['-z']
    }
  }
  const args = [
    ...getCompressionProgram(),
    '-tf',
    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    '-P'
  ]
  await execTar(args, compressionMethod)
}
