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
import {ChildProcessWithoutNullStreams, spawn} from 'child_process'

const IS_WINDOWS = process.platform === 'win32'

enum TAR_MODE {
  CREATE = 'create',
  EXTRACT = 'extract',
  EXTRACT_STREAM = 'extractStream',
  LIST = 'list'
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
  type: TAR_MODE,
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
    case TAR_MODE.CREATE:
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
    case TAR_MODE.EXTRACT:
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
    case TAR_MODE.EXTRACT_STREAM:
      args.push(
        '-xf',
        '-',
        '-P',
        '-C',
        workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
      )
      break
    case TAR_MODE.LIST:
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
  type: TAR_MODE,
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
    type !== TAR_MODE.CREATE
      ? await getDecompressionProgram(tarPath, compressionMethod, archivePath)
      : await getCompressionProgram(tarPath, compressionMethod)
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  if (BSD_TAR_ZSTD && type !== TAR_MODE.CREATE) {
    args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')]
  } else {
    args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')]
  }

  if (BSD_TAR_ZSTD) {
    return args
  }

  return [args.join(' ')]
}

/*
 * Returns command pipes to stream data to tar and compression program.
 * Only supports tar and zstd at the moment
 * @returns Array of ChildProcessWithoutNullStreams. Pipe to the processes in the order they are returned
 */
async function getCommandPipes(
  compressionMethod: CompressionMethod,
  type: TAR_MODE,
  archivePath = ''
): Promise<ChildProcessWithoutNullStreams[]> {
  const spawnedProcesses: ChildProcessWithoutNullStreams[] = []

  const tarPath = await getTarPath()
  const tarArgs = await getTarArgs(
    tarPath,
    compressionMethod,
    type,
    archivePath
  )
  // Remove tar executable from tarArgs
  tarArgs.shift()

  let zstdInfo =
    type !== TAR_MODE.CREATE
      ? await getDecompressionProgramStream(tarPath, compressionMethod)
      : await getCompressionProgramStream(tarPath, compressionMethod)

  const zstdProcess = spawn(zstdInfo.command, zstdInfo.args)
  spawnedProcesses.push(zstdProcess)

  const tarProcess = spawn(tarPath.path, tarArgs)
  spawnedProcesses.push(tarProcess)

  return spawnedProcesses
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

// Alternative to getDecompressionProgram which returns zstd that command that can be piped into
async function getDecompressionProgramStream(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod
): Promise<{command: string; args: string[]}> {
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? {command: 'zstd', args: ['-d', '--long=30', '--force', '--stdout']}
        : {
            command: IS_WINDOWS ? 'zstd' : 'unzstd',
            args: IS_WINDOWS
              ? ['-d', '--long=30', '--stdout', '-T0']
              : ['--long=30', '--stdout', '-T0']
          }
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? {command: 'zstd', args: ['-d', '--force', '--stdout']}
        : {
            command: IS_WINDOWS ? 'zstd' : 'unzstd',
            args: ['-d', '--stdout', '-T0']
          }
    default:
      // Assuming gzip is the default method if none specified
      return {command: 'gzip', args: ['-d']}
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

async function getCompressionProgramStream(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod
): Promise<{command: string; args: string[]}> {
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? {
            command: 'zstd',
            args: ['-T0', '--long=30', '--force', '--stdout']
          }
        : {
            command: IS_WINDOWS ? 'zstd' : 'zstdmt',
            args: IS_WINDOWS
              ? ['-T0', '--long=30', '--stdout', '-T0']
              : ['--long=30', '--stdout', '-T0']
          }
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? {
            command: 'zstd',
            args: ['-T0', '--force', '--stdout']
          }
        : {
            command: IS_WINDOWS ? 'zstd' : 'zstdmt',
            args: ['-T0', '--stdout']
          }
    default:
      // Assuming gzip is the default method if none specified
      return {command: 'gzip', args: []}
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
  const commands = await getCommands(
    compressionMethod,
    TAR_MODE.LIST,
    archivePath
  )
  await execCommands(commands)
}

export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  // Create directory to extract tar into
  const workingDirectory = getWorkingDirectory()
  await io.mkdirP(workingDirectory)
  const commands = await getCommands(
    compressionMethod,
    TAR_MODE.EXTRACT,
    archivePath
  )
  await execCommands(commands)
}

/*
 * NOTE: Currently tested only on archives created using tar and zstd
 */
export async function extractStreamingTar(
  stream: NodeJS.ReadableStream,
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  const workingDirectory = getWorkingDirectory()
  await io.mkdirP(workingDirectory)
  const commandPipes = await getCommandPipes(
    compressionMethod,
    TAR_MODE.EXTRACT_STREAM,
    archivePath
  )

  if (commandPipes.length < 2) {
    throw new Error(
      'At least two processes should be present as the archive is compressed at least twice.'
    )
  }

  return new Promise((resolve, reject) => {
    stream.pipe(commandPipes[0].stdin)
    for (let i = 0; i < commandPipes.length - 1; i++) {
      commandPipes[i].stdout.pipe(commandPipes[i + 1].stdin)

      commandPipes[i].stderr.on('data', data => {
        reject(
          new Error(`Error in ${commandPipes[i].spawnfile}: ${data.toString()}`)
        )
      })

      commandPipes[i].on('error', error => {
        reject(
          new Error(`Error in ${commandPipes[i].spawnfile}: ${error.message}`)
        )
      })
    }

    const lastCommand = commandPipes[commandPipes.length - 1]
    lastCommand.stderr.on('data', data => {
      console.error(`Error in ${lastCommand.spawnfile}:`, data.toString())
      reject(new Error(`Error in ${lastCommand.spawnfile}: ${data.toString()}`))
    })
    lastCommand.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Last command exited with code ${code}`))
      }
    })
  })
}

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
  const commands = await getCommands(compressionMethod, TAR_MODE.CREATE)
  await execCommands(commands, archiveFolder)
}
