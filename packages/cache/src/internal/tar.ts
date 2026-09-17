import {exec} from '@actions/exec'
import * as io from '@actions/io'
import {existsSync, writeFileSync} from 'fs'
import * as path from 'path'
import * as utils from './cacheUtils.js'
import {ArchiveTool} from './contracts.js'
import {
  CompressionMethod,
  SystemTarPathOnWindows,
  ArchiveToolType,
  TarFilename,
  ManifestFilename
} from './constants.js'

const IS_WINDOWS = process.platform === 'win32'

interface TarCommands {
  commands: string[]
  requiresTempDirectory: boolean
}

function isBsdTarZstd(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod
): boolean {
  return (
    IS_WINDOWS &&
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip
  )
}

// Returns tar path and type: BSD or GNU
async function getTarPath(): Promise<ArchiveTool> {
  switch (process.platform) {
    case 'win32': {
      const gnuTar = await utils.getGnuTarPathOnWindows()
      const systemTar = SystemTarPathOnWindows
      if (gnuTar) {
        // Use GNUtar as default on windows
        return <ArchiveTool>{path: gnuTar, type: ArchiveToolType.GNU}
      } else if (existsSync(systemTar)) {
        return <ArchiveTool>{path: systemTar, type: ArchiveToolType.BSD}
      }
      break
    }
    case 'darwin': {
      const gnuTar = await io.which('gtar', false)
      if (gnuTar) {
        // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
        return <ArchiveTool>{path: gnuTar, type: ArchiveToolType.GNU}
      } else {
        return <ArchiveTool>{
          path: await io.which('tar', true),
          type: ArchiveToolType.BSD
        }
      }
    }
    default:
      break
  }
  // Default assumption is GNU tar is present in path
  return <ArchiveTool>{
    path: await io.which('tar', true),
    type: ArchiveToolType.GNU
  }
}

// Return arguments for tar as per tarPath, compressionMethod, method type and os
async function getTarArgs(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod,
  type: string,
  archivePath = ''
): Promise<string[]> {
  const args = [`"${tarPath.path}"`]
  const BSD_TAR_ZSTD = isBsdTarZstd(tarPath, compressionMethod)
  const tarFile = BSD_TAR_ZSTD
    ? TarFilename
    : (type === 'create'
        ? utils.getCacheFileName(compressionMethod)
        : archivePath
      ).replace(new RegExp(`\\${path.sep}`, 'g'), '/')
  const workingDirectory = BSD_TAR_ZSTD
    ? quoteAbsolutePath(getWorkingDirectory())
    : getWorkingDirectory().replace(new RegExp(`\\${path.sep}`, 'g'), '/')

  // Method specific args
  switch (type) {
    case 'create':
      args.push(
        '--posix',
        '-cf',
        tarFile,
        '--exclude',
        tarFile,
        '-P',
        '-C',
        workingDirectory,
        '--files-from',
        ManifestFilename
      )
      break
    case 'extract':
      args.push('-xf', tarFile, '-P', '-C', workingDirectory)
      break
    case 'list':
      args.push('-tf', tarFile, '-P')
      break
  }

  // Platform specific args
  if (tarPath.type === ArchiveToolType.GNU) {
    switch (process.platform) {
      case 'win32':
        args.push('--force-local')
        break
      case 'darwin':
        args.push('--delay-directory-restore')
        break
    }
  }

  return args
}

// Returns commands to run tar and compression program
async function getCommands(
  compressionMethod: CompressionMethod,
  type: string,
  archivePath = ''
): Promise<TarCommands> {
  let args

  const tarPath = await getTarPath()
  const tarArgs = await getTarArgs(
    tarPath,
    compressionMethod,
    type,
    archivePath
  )
  const compressionArgs =
    type !== 'create'
      ? await getDecompressionProgram(tarPath, compressionMethod, archivePath)
      : await getCompressionProgram(tarPath, compressionMethod)
  const BSD_TAR_ZSTD = isBsdTarZstd(tarPath, compressionMethod)

  if (BSD_TAR_ZSTD && type !== 'create') {
    args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')]
  } else {
    args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')]
  }

  return {
    commands: BSD_TAR_ZSTD ? args : [args.join(' ')],
    requiresTempDirectory: BSD_TAR_ZSTD && type !== 'create'
  }
}

function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
}

function quoteAbsolutePath(filePath: string): string {
  return `"${path.resolve(filePath).replace(new RegExp(`\\${path.sep}`, 'g'), '/')}"`
}

// Common function for extractTar and listTar to get the compression method
async function getDecompressionProgram(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod,
  archivePath: string
): Promise<string[]> {
  // -d: Decompress.
  // unzstd is equivalent to 'zstd -d'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  const BSD_TAR_ZSTD = isBsdTarZstd(tarPath, compressionMethod)
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --long=30 --force -o',
            TarFilename,
            quoteAbsolutePath(archivePath)
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? '"zstd -d --long=30"' : 'unzstd --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? ['zstd -d --force -o', TarFilename, quoteAbsolutePath(archivePath)]
        : ['--use-compress-program', IS_WINDOWS ? '"zstd -d"' : 'unzstd']
    default:
      return ['-z']
  }
}

// Used for creating the archive
// -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
// zstdmt is equivalent to 'zstd -T0'
// --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
// Using 30 here because we also support 32-bit self-hosted runners.
// Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
async function getCompressionProgram(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod
): Promise<string[]> {
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const BSD_TAR_ZSTD = isBsdTarZstd(tarPath, compressionMethod)
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -T0 --long=30 --force -o',
            cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            TarFilename
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? '"zstd -T0 --long=30"' : 'zstdmt --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? [
            'zstd -T0 --force -o',
            cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            TarFilename
          ]
        : ['--use-compress-program', IS_WINDOWS ? '"zstd -T0"' : 'zstdmt']
    default:
      return ['-z']
  }
}

// Executes all commands as separate processes
async function execCommands(
  {commands, requiresTempDirectory}: TarCommands,
  cwd?: string
): Promise<void> {
  // The Windows BSD-tar fallback decompresses into cache.tar before reading
  // it. Isolate that intermediate for each list/extract operation, including
  // debug listings during saves. Creation already has its own archive folder.
  const tempDirectory = requiresTempDirectory
    ? await utils.createTempDirectory()
    : undefined
  try {
    for (const command of commands) {
      try {
        await exec(command, undefined, {
          cwd: tempDirectory ?? cwd,
          env: {...(process.env as object), MSYS: 'winsymlinks:nativestrict'}
        })
      } catch (error) {
        throw new Error(
          `${command.split(' ')[0]} failed with error: ${error?.message}`
        )
      }
    }
  } finally {
    if (tempDirectory) {
      await io.rmRF(tempDirectory)
    }
  }
}

// List the contents of a tar
export async function listTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  const commands = await getCommands(compressionMethod, 'list', archivePath)
  await execCommands(commands)
}

// Extract a tar
export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // Create directory to extract tar into
  const workingDirectory = getWorkingDirectory()
  await io.mkdirP(workingDirectory)
  const commands = await getCommands(compressionMethod, 'extract', archivePath)
  await execCommands(commands)
}

// Create a tar
export async function createTar(
  archiveFolder: string,
  sourceDirectories: string[],
  compressionMethod: CompressionMethod
): Promise<void> {
  // Write source directories to manifest.txt to avoid command length limits
  writeFileSync(
    path.join(archiveFolder, ManifestFilename),
    sourceDirectories.join('\n')
  )
  const commands = await getCommands(compressionMethod, 'create')
  await execCommands(commands, archiveFolder)
}
