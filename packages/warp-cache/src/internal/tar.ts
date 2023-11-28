import {exec} from '@actions/exec'
import * as io from '@actions/io'
import {existsSync, writeFileSync} from 'fs'
import * as path from 'path'
import * as utils from './cacheUtils'
import {ArchiveTool} from './contracts'
import {
  CompressionMethod,
  SystemTarPathOnWindows,
  ArchiveToolType,
  TarFilename,
  ManifestFilename
} from './constants'

const IS_WINDOWS = process.platform === 'win32'

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
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const tarFile = 'cache.tar'
  const workingDirectory = getWorkingDirectory()
  // Speficic args for BSD tar on windows for workaround
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

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
        ManifestFilename
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
): Promise<string[]> {
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
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  if (BSD_TAR_ZSTD && type !== 'create') {
    args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')]
  } else {
    args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')]
  }

  if (BSD_TAR_ZSTD) {
    return args
  }

  return [args.join(' ')]
}

function getWorkingDirectory(): string {
  return process.env['GITHUB_WORKSPACE'] ?? process.cwd()
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
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --long=30 --force -o',
            TarFilename,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? '"zstd -d --long=30"' : 'unzstd --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --force -o',
            TarFilename,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
          ]
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
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS
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
async function execCommands(commands: string[], cwd?: string): Promise<void> {
  for (const command of commands) {
    try {
      await exec(command, undefined, {
        cwd,
        env: {...(process.env as object), MSYS: 'winsymlinks:nativestrict'}
      })
    } catch (error) {
      throw new Error(
        `${command.split(' ')[0]} failed with error: ${error?.message}`
      )
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
