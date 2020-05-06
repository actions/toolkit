import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as path from 'path'
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

export function getArchiveFileSize(filePath: string): number {
  return fs.statSync(filePath).size
}

export function logWarning(message: string): void {
  const warningPrefix = '[warning]'
  core.info(`${warningPrefix}${message}`)
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

export async function getCompressionMethod(): Promise<CompressionMethod> {
  const versionOutput = await getVersion('zstd')
  return versionOutput.toLowerCase().includes('zstd command line interface')
    ? CompressionMethod.Zstd
    : CompressionMethod.Gzip
}

export function getCacheFileName(compressionMethod: CompressionMethod): string {
  return compressionMethod === CompressionMethod.Zstd
    ? CacheFilename.Zstd
    : CacheFilename.Gzip
}

export async function useGnuTar(): Promise<boolean> {
  const versionOutput = await getVersion('tar')
  return versionOutput.toLowerCase().includes('gnu tar')
}
