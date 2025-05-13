import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as semver from 'semver'
import * as util from 'util'
import {
  CacheFilename,
  CompressionMethod,
  GnuTarPathOnWindows
} from './constants'

const versionSalt = '1.0'

// From https://github.com/actions/toolkit/blob/main/packages/tool-cache/src/tool-cache.ts#L23
export async function createTempDirectory(): Promise<string> {
  const IS_WINDOWS = process.platform === 'win32'

  let tempDirectory: string = process.env['RUNNER_TEMP'] || ''

  if (!tempDirectory) {
    let baseLocation: string
    if (IS_WINDOWS) {
      // On Windows use the USERPROFILE env variable
      baseLocation = process.env['USERPROFILE'] || 'C:\\'
    } else {
      if (process.platform === 'darwin') {
        baseLocation = '/Users'
      } else {
        baseLocation = '/home'
      }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp')
  }

  const dest = path.join(tempDirectory, crypto.randomUUID())
  await io.mkdirP(dest)
  return dest
}

export function getArchiveFileSizeInBytes(filePath: string): number {
  return fs.statSync(filePath).size
}

export async function resolvePaths(patterns: string[]): Promise<string[]> {
  const paths: string[] = []
  const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd()
  const globber = await glob.create(patterns.join('\n'), {
    implicitDescendants: false
  })

  for await (const file of globber.globGenerator()) {
    const relativeFile = path
      .relative(workspace, file)
      .replace(new RegExp(`\\${path.sep}`, 'g'), '/')
    core.debug(`Matched: ${relativeFile}`)
    // Paths are made relative so the tar entries are all relative to the root of the workspace.
    if (relativeFile === '') {
      // path.relative returns empty string if workspace and file are equal
      paths.push('.')
    } else {
      paths.push(`${relativeFile}`)
    }
  }

  return paths
}

export async function unlinkFile(filePath: fs.PathLike): Promise<void> {
  return util.promisify(fs.unlink)(filePath)
}

async function getVersion(
  app: string,
  additionalArgs: string[] = []
): Promise<string> {
  let versionOutput = ''
  additionalArgs.push('--version')
  core.debug(`Checking ${app} ${additionalArgs.join(' ')}`)
  try {
    await exec.exec(`${app}`, additionalArgs, {
      ignoreReturnCode: true,
      silent: true,
      listeners: {
        stdout: (data: Buffer): string => (versionOutput += data.toString()),
        stderr: (data: Buffer): string => (versionOutput += data.toString())
      }
    })
  } catch (err) {
    core.debug(err.message)
  }

  versionOutput = versionOutput.trim()
  core.debug(versionOutput)
  return versionOutput
}

// Use zstandard if possible to maximize cache performance
export async function getCompressionMethod(): Promise<CompressionMethod> {
  const versionOutput = await getVersion('zstd', ['--quiet'])
  const version = semver.clean(versionOutput)
  core.debug(`zstd version: ${version}`)

  if (version === null) {
    return CompressionMethod.Gzip
  } else if (semver.lt(version, '1.3.2')) {
    return CompressionMethod.ZstdWithoutLong
  } else if (semver.lt(version, '1.3.6')) {
    return CompressionMethod.ZstdWithoutAdapt
  } else {
    return CompressionMethod.Zstd
  }
}

export function getCacheFileName(compressionMethod: CompressionMethod): string {
  return compressionMethod === CompressionMethod.Gzip
    ? CacheFilename.Gzip
    : CacheFilename.Zstd
}

export async function getGnuTarPathOnWindows(): Promise<string> {
  if (fs.existsSync(GnuTarPathOnWindows)) {
    return GnuTarPathOnWindows
  }
  const versionOutput = await getVersion('tar')
  return versionOutput.toLowerCase().includes('gnu tar') ? io.which('tar') : ''
}

export function assertDefined<T>(name: string, value?: T): T {
  if (value === undefined) {
    throw Error(`Expected ${name} but value was undefiend`)
  }

  return value
}

export function getCacheVersion(
  paths: string[],
  compressionMethod?: CompressionMethod,
  enableCrossOsArchive = false
): string {
  // don't pass changes upstream
  const components = paths.slice()

  // Add compression method to cache version to restore
  // compressed cache as per compression method
  if (compressionMethod) {
    components.push(compressionMethod)
  }

  // Only check for windows platforms if enableCrossOsArchive is false
  if (process.platform === 'win32' && !enableCrossOsArchive) {
    components.push('windows-only')
  }

  // Add salt to cache version to support breaking changes in cache entry
  components.push(versionSalt)

  return crypto.createHash('sha256').update(components.join('|')).digest('hex')
}

export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get the ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}
