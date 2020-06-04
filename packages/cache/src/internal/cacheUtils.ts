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
import {getVersion} from './execUtils'

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

export async function getAzCopyCommand(): Promise<string | undefined> {
  let versionOutput = await getVersion('azcopy')
  core.info(`azcopy output: ${versionOutput}`)

  if (versionOutput.endsWith('-netcore')) {
    versionOutput = versionOutput.substring(0, versionOutput.length-8);
  }

  const version = semver.clean(versionOutput)
  core.info(`version: ${version}`)

  if (version) {
    // Make sure we use the latest version on Linux. At the time of writing, azcopy
    // refers to v7.3.0 but alias azcopy10 refers to v10.4.0.
    if (process.platform == 'linux') {
      const version10Output = await getVersion('azcopy10')
      const version10 = semver.clean(version10Output)

      if (version10 && semver.lt(version, version10)) {
        return 'azcopy10'
      }
    }

    return 'azcopy'
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
