import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as path from 'path'
import * as semver from 'semver'
import * as util from 'util'
import {v4 as uuidV4} from 'uuid'
import {CacheFilename, CompressionMethod} from './constants'

// From https://github.com/actions/toolkit/blob/master/packages/tool-cache/src/tool-cache.ts#L23
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

  const dest = path.join(tempDirectory, uuidV4())
  await io.mkdirP(dest)
  return dest
}

export function getArchiveFileSizeIsBytes(filePath: string): number {
  return fs.statSync(filePath).size
}

export async function resolvePaths(patterns: string[]): Promise<string[]> {
  const paths: string[] = []
  const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd()
  const globber = await glob.create(patterns.join('\n'), {
    implicitDescendants: false
  })

  for await (const file of globber.globGenerator()) {
    const relativeFile = path.relative(workspace, file)
    core.debug(`Matched: ${relativeFile}`)
    // Paths are made relative so the tar entries are all relative to the root of the workspace.
    paths.push(`${relativeFile}`)
  }

  return paths
}

export async function unlinkFile(filePath: fs.PathLike): Promise<void> {
  return util.promisify(fs.unlink)(filePath)
}

async function getVersion(app: string): Promise<string> {
  core.debug(`Checking ${app} --version`)
  let versionOutput = ''
  try {
    await exec.exec(`${app} --version`, [], {
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
  if (process.platform === 'win32' && !(await isGnuTarInstalled())) {
    // Disable zstd due to bug https://github.com/actions/cache/issues/301
    return CompressionMethod.Gzip
  }

  const versionOutput = await getVersion('zstd')
  const version = semver.clean(versionOutput)

  if (!versionOutput.toLowerCase().includes('zstd command line interface')) {
    // zstd is not installed
    return CompressionMethod.Gzip
  } else if (!version || semver.lt(version, 'v1.3.2')) {
    // zstd is installed but using a version earlier than v1.3.2
    // v1.3.2 is required to use the `--long` options in zstd
    return CompressionMethod.ZstdWithoutLong
  } else {
    return CompressionMethod.Zstd
  }
}

export function getCacheFileName(compressionMethod: CompressionMethod): string {
  return compressionMethod === CompressionMethod.Gzip
    ? CacheFilename.Gzip
    : CacheFilename.Zstd
}

export async function isGnuTarInstalled(): Promise<boolean> {
  const versionOutput = await getVersion('tar')
  return versionOutput.toLowerCase().includes('gnu tar')
}

export async function getAzCopyCommand(): Promise<string | undefined> {
  // Always prefer the azcopy10 alias first, which is the correct version on Ubuntu.
  let versionOutput = await getVersion('azcopy10')

  if (versionOutput.toLowerCase().startsWith('azcopy version')) {
    return 'azcopy10'
  }

  // Fall back to any azcopy that is version 10 or newer.
  versionOutput = await getVersion('azcopy')

  if (versionOutput.toLowerCase().startsWith('azcopy version')) {
    const version = versionOutput.substring(15)

    if (semver.gte(version, '10.0.0')) {
      return 'azcopy'
    } else {
      core.debug(`Found azcopy but version is not supported: ${version}`)
    }
  }

  // Otherwise, azcopy is not available.
  return undefined
}
