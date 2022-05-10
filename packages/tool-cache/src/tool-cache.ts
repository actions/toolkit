import * as core from '@actions/core'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as mm from './manifest'
import * as os from 'os'
import * as path from 'path'
import * as httpm from '@actions/http-client'
import * as semver from 'semver'
import * as stream from 'stream'
import * as util from 'util'
import {ok} from 'assert'
import {OutgoingHttpHeaders} from 'http'
import uuidV4 from 'uuid/v4'
import {exec} from '@actions/exec/lib/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import {RetryHelper} from './retry-helper'

export class HTTPError extends Error {
  constructor(readonly httpStatusCode: number | undefined) {
    super(`Unexpected HTTP response: ${httpStatusCode}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

const IS_WINDOWS = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'
const userAgent = 'actions/tool-cache'

/**
 * Download a tool from an url and stream it into a file
 *
 * @param url       url of tool to download
 * @param dest      path to download tool
 * @param auth      authorization header
 * @param headers   other headers
 * @returns         path to downloaded tool
 */
export async function downloadTool(
  url: string,
  dest?: string,
  auth?: string,
  headers?: OutgoingHttpHeaders
): Promise<string> {
  dest = dest || path.join(_getTempDirectory(), uuidV4())
  await io.mkdirP(path.dirname(dest))
  core.debug(`Downloading ${url}`)
  core.debug(`Destination ${dest}`)

  const maxAttempts = 3
  const minSeconds = _getGlobal<number>(
    'TEST_DOWNLOAD_TOOL_RETRY_MIN_SECONDS',
    10
  )
  const maxSeconds = _getGlobal<number>(
    'TEST_DOWNLOAD_TOOL_RETRY_MAX_SECONDS',
    20
  )
  const retryHelper = new RetryHelper(maxAttempts, minSeconds, maxSeconds)
  return await retryHelper.execute(
    async () => {
      return await downloadToolAttempt(url, dest || '', auth, headers)
    },
    (err: Error) => {
      if (err instanceof HTTPError && err.httpStatusCode) {
        // Don't retry anything less than 500, except 408 Request Timeout and 429 Too Many Requests
        if (
          err.httpStatusCode < 500 &&
          err.httpStatusCode !== 408 &&
          err.httpStatusCode !== 429
        ) {
          return false
        }
      }

      // Otherwise retry
      return true
    }
  )
}

async function downloadToolAttempt(
  url: string,
  dest: string,
  auth?: string,
  headers?: OutgoingHttpHeaders
): Promise<string> {
  if (fs.existsSync(dest)) {
    throw new Error(`Destination file path ${dest} already exists`)
  }

  // Get the response headers
  const http = new httpm.HttpClient(userAgent, [], {
    allowRetries: false
  })

  if (auth) {
    core.debug('set auth')
    if (headers === undefined) {
      headers = {}
    }
    headers.authorization = auth
  }

  const response: httpm.HttpClientResponse = await http.get(url, headers)
  if (response.message.statusCode !== 200) {
    const err = new HTTPError(response.message.statusCode)
    core.debug(
      `Failed to download from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`
    )
    throw err
  }

  // Download the response body
  const pipeline = util.promisify(stream.pipeline)
  const responseMessageFactory = _getGlobal<() => stream.Readable>(
    'TEST_DOWNLOAD_TOOL_RESPONSE_MESSAGE_FACTORY',
    () => response.message
  )
  const readStream = responseMessageFactory()
  let succeeded = false
  try {
    await pipeline(readStream, fs.createWriteStream(dest))
    core.debug('download complete')
    succeeded = true
    return dest
  } finally {
    // Error, delete dest before retry
    if (!succeeded) {
      core.debug('download failed')
      try {
        await io.rmRF(dest)
      } catch (err) {
        core.debug(`Failed to delete '${dest}'. ${err.message}`)
      }
    }
  }
}

/**
 * Extract a .7z file
 *
 * @param file     path to the .7z file
 * @param dest     destination directory. Optional.
 * @param _7zPath  path to 7zr.exe. Optional, for long path support. Most .7z archives do not have this
 * problem. If your .7z archive contains very long paths, you can pass the path to 7zr.exe which will
 * gracefully handle long paths. By default 7zdec.exe is used because it is a very small program and is
 * bundled with the tool lib. However it does not support long paths. 7zr.exe is the reduced command line
 * interface, it is smaller than the full command line interface, and it does support long paths. At the
 * time of this writing, it is freely available from the LZMA SDK that is available on the 7zip website.
 * Be sure to check the current license agreement. If 7zr.exe is bundled with your action, then the path
 * to 7zr.exe can be pass to this function.
 * @returns        path to the destination directory
 */
export async function extract7z(
  file: string,
  dest?: string,
  _7zPath?: string
): Promise<string> {
  ok(IS_WINDOWS, 'extract7z() not supported on current OS')
  ok(file, 'parameter "file" is required')

  dest = await _createExtractFolder(dest)

  const originalCwd = process.cwd()
  process.chdir(dest)
  if (_7zPath) {
    try {
      const logLevel = core.isDebug() ? '-bb1' : '-bb0'
      const args: string[] = [
        'x', // eXtract files with full paths
        logLevel, // -bb[0-3] : set output log level
        '-bd', // disable progress indicator
        '-sccUTF-8', // set charset for for console input/output
        file
      ]
      const options: ExecOptions = {
        silent: true
      }
      await exec(`"${_7zPath}"`, args, options)
    } finally {
      process.chdir(originalCwd)
    }
  } else {
    const escapedScript = path
      .join(__dirname, '..', 'scripts', 'Invoke-7zdec.ps1')
      .replace(/'/g, "''")
      .replace(/"|\n|\r/g, '') // double-up single quotes, remove double quotes and newlines
    const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, '')
    const escapedTarget = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '')
    const command = `& '${escapedScript}' -Source '${escapedFile}' -Target '${escapedTarget}'`
    const args: string[] = [
      '-NoLogo',
      '-Sta',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Unrestricted',
      '-Command',
      command
    ]
    const options: ExecOptions = {
      silent: true
    }
    try {
      const powershellPath: string = await io.which('powershell', true)
      await exec(`"${powershellPath}"`, args, options)
    } finally {
      process.chdir(originalCwd)
    }
  }

  return dest
}

/**
 * Extract a compressed tar archive
 *
 * @param file     path to the tar
 * @param dest     destination directory. Optional.
 * @param flags    flags for the tar command to use for extraction. Defaults to 'xz' (extracting gzipped tars). Optional.
 * @returns        path to the destination directory
 */
export async function extractTar(
  file: string,
  dest?: string,
  flags: string | string[] = 'xz'
): Promise<string> {
  if (!file) {
    throw new Error("parameter 'file' is required")
  }

  // Create dest
  dest = await _createExtractFolder(dest)

  // Determine whether GNU tar
  core.debug('Checking tar --version')
  let versionOutput = ''
  await exec('tar --version', [], {
    ignoreReturnCode: true,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => (versionOutput += data.toString()),
      stderr: (data: Buffer) => (versionOutput += data.toString())
    }
  })
  core.debug(versionOutput.trim())
  const isGnuTar = versionOutput.toUpperCase().includes('GNU TAR')

  // Initialize args
  let args: string[]
  if (flags instanceof Array) {
    args = flags
  } else {
    args = [flags]
  }

  if (core.isDebug() && !flags.includes('v')) {
    args.push('-v')
  }

  let destArg = dest
  let fileArg = file
  if (IS_WINDOWS && isGnuTar) {
    args.push('--force-local')
    destArg = dest.replace(/\\/g, '/')

    // Technically only the dest needs to have `/` but for aesthetic consistency
    // convert slashes in the file arg too.
    fileArg = file.replace(/\\/g, '/')
  }

  if (isGnuTar) {
    // Suppress warnings when using GNU tar to extract archives created by BSD tar
    args.push('--warning=no-unknown-keyword')
    args.push('--overwrite')
  }

  args.push('-C', destArg, '-f', fileArg)
  await exec(`tar`, args)

  return dest
}

/**
 * Extract a xar compatible archive
 *
 * @param file     path to the archive
 * @param dest     destination directory. Optional.
 * @param flags    flags for the xar. Optional.
 * @returns        path to the destination directory
 */
export async function extractXar(
  file: string,
  dest?: string,
  flags: string | string[] = []
): Promise<string> {
  ok(IS_MAC, 'extractXar() not supported on current OS')
  ok(file, 'parameter "file" is required')

  dest = await _createExtractFolder(dest)

  let args: string[]
  if (flags instanceof Array) {
    args = flags
  } else {
    args = [flags]
  }

  args.push('-x', '-C', dest, '-f', file)

  if (core.isDebug()) {
    args.push('-v')
  }

  const xarPath: string = await io.which('xar', true)
  await exec(`"${xarPath}"`, _unique(args))

  return dest
}

/**
 * Extract a zip
 *
 * @param file     path to the zip
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extractZip(file: string, dest?: string): Promise<string> {
  if (!file) {
    throw new Error("parameter 'file' is required")
  }

  dest = await _createExtractFolder(dest)

  if (IS_WINDOWS) {
    await extractZipWin(file, dest)
  } else {
    await extractZipNix(file, dest)
  }

  return dest
}

async function extractZipWin(file: string, dest: string): Promise<void> {
  // build the powershell command
  const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, '') // double-up single quotes, remove double quotes and newlines
  const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '')
  const pwshPath = await io.which('pwsh', false)

  //To match the file overwrite behavior on nix systems, we use the overwrite = true flag for ExtractToDirectory
  //and the -Force flag for Expand-Archive as a fallback
  if (pwshPath) {
    //attempt to use pwsh with ExtractToDirectory, if this fails attempt Expand-Archive
    const pwshCommand = [
      `$ErrorActionPreference = 'Stop' ;`,
      `try { Add-Type -AssemblyName System.IO.Compression.ZipFile } catch { } ;`,
      `try { [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`,
      `catch { if (($_.Exception.GetType().FullName -eq 'System.Management.Automation.MethodException') -or ($_.Exception.GetType().FullName -eq 'System.Management.Automation.RuntimeException') ){ Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force } else { throw $_ } } ;`
    ].join(' ')

    const args = [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Unrestricted',
      '-Command',
      pwshCommand
    ]

    core.debug(`Using pwsh at path: ${pwshPath}`)
    await exec(`"${pwshPath}"`, args)
  } else {
    const powershellCommand = [
      `$ErrorActionPreference = 'Stop' ;`,
      `try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ;`,
      `if ((Get-Command -Name Expand-Archive -Module Microsoft.PowerShell.Archive -ErrorAction Ignore)) { Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force }`,
      `else {[System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`
    ].join(' ')

    const args = [
      '-NoLogo',
      '-Sta',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Unrestricted',
      '-Command',
      powershellCommand
    ]

    const powershellPath = await io.which('powershell', true)
    core.debug(`Using powershell at path: ${powershellPath}`)

    await exec(`"${powershellPath}"`, args)
  }
}

async function extractZipNix(file: string, dest: string): Promise<void> {
  const unzipPath = await io.which('unzip', true)
  const args = [file]
  if (!core.isDebug()) {
    args.unshift('-q')
  }
  args.unshift('-o') //overwrite with -o, otherwise a prompt is shown which freezes the run
  await exec(`"${unzipPath}"`, args, {cwd: dest})
}

/**
 * Caches a directory and installs it into the tool cacheDir
 *
 * @param sourceDir    the directory to cache into tools
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
export async function cacheDir(
  sourceDir: string,
  tool: string,
  version: string,
  arch?: string
): Promise<string> {
  version = semver.clean(version) || version
  arch = arch || os.arch()
  core.debug(`Caching tool ${tool} ${version} ${arch}`)

  core.debug(`source dir: ${sourceDir}`)
  if (!fs.statSync(sourceDir).isDirectory()) {
    throw new Error('sourceDir is not a directory')
  }

  // Create the tool dir
  const destPath: string = await _createToolPath(tool, version, arch)
  // copy each child item. do not move. move can fail on Windows
  // due to anti-virus software having an open handle on a file.
  for (const itemName of fs.readdirSync(sourceDir)) {
    const s = path.join(sourceDir, itemName)
    await io.cp(s, destPath, {recursive: true})
  }

  // write .complete
  _completeToolPath(tool, version, arch)

  return destPath
}

/**
 * Caches a downloaded file (GUID) and installs it
 * into the tool cache with a given targetName
 *
 * @param sourceFile    the file to cache into tools.  Typically a result of downloadTool which is a guid.
 * @param targetFile    the name of the file name in the tools directory
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
export async function cacheFile(
  sourceFile: string,
  targetFile: string,
  tool: string,
  version: string,
  arch?: string
): Promise<string> {
  version = semver.clean(version) || version
  arch = arch || os.arch()
  core.debug(`Caching tool ${tool} ${version} ${arch}`)

  core.debug(`source file: ${sourceFile}`)
  if (!fs.statSync(sourceFile).isFile()) {
    throw new Error('sourceFile is not a file')
  }

  // create the tool dir
  const destFolder: string = await _createToolPath(tool, version, arch)

  // copy instead of move. move can fail on Windows due to
  // anti-virus software having an open handle on a file.
  const destPath: string = path.join(destFolder, targetFile)
  core.debug(`destination file ${destPath}`)
  await io.cp(sourceFile, destPath)

  // write .complete
  _completeToolPath(tool, version, arch)

  return destFolder
}

/**
 * Finds the path to a tool version in the local installed tool cache
 *
 * @param toolName      name of the tool
 * @param versionSpec   version of the tool
 * @param arch          optional arch.  defaults to arch of computer
 */
export function find(
  toolName: string,
  versionSpec: string,
  arch?: string
): string {
  if (!toolName) {
    throw new Error('toolName parameter is required')
  }

  if (!versionSpec) {
    throw new Error('versionSpec parameter is required')
  }

  arch = arch || os.arch()

  // attempt to resolve an explicit version
  if (!isExplicitVersion(versionSpec)) {
    const localVersions: string[] = findAllVersions(toolName, arch)
    const match = evaluateVersions(localVersions, versionSpec)
    versionSpec = match
  }

  // check for the explicit version in the cache
  let toolPath = ''
  if (versionSpec) {
    versionSpec = semver.clean(versionSpec) || ''
    const cachePath = path.join(
      _getCacheDirectory(),
      toolName,
      versionSpec,
      arch
    )
    core.debug(`checking cache: ${cachePath}`)
    if (fs.existsSync(cachePath) && fs.existsSync(`${cachePath}.complete`)) {
      core.debug(`Found tool in cache ${toolName} ${versionSpec} ${arch}`)
      toolPath = cachePath
    } else {
      core.debug('not found')
    }
  }
  return toolPath
}

/**
 * Finds the paths to all versions of a tool that are installed in the local tool cache
 *
 * @param toolName  name of the tool
 * @param arch      optional arch.  defaults to arch of computer
 */
export function findAllVersions(toolName: string, arch?: string): string[] {
  const versions: string[] = []

  arch = arch || os.arch()
  const toolPath = path.join(_getCacheDirectory(), toolName)

  if (fs.existsSync(toolPath)) {
    const children: string[] = fs.readdirSync(toolPath)
    for (const child of children) {
      if (isExplicitVersion(child)) {
        const fullPath = path.join(toolPath, child, arch || '')
        if (fs.existsSync(fullPath) && fs.existsSync(`${fullPath}.complete`)) {
          versions.push(child)
        }
      }
    }
  }

  return versions
}

// versions-manifest
//
// typical pattern of a setup-* action that supports JIT would be:
// 1. resolve semver against local cache
//
// 2. if no match, download
//   a. query versions manifest to match
//   b. if no match, fall back to source if exists (tool distribution)
//   c. with download url, download, install and preprent path

export type IToolRelease = mm.IToolRelease
export type IToolReleaseFile = mm.IToolReleaseFile

interface GitHubTreeItem {
  path: string
  size: string
  url: string
}

interface GitHubTree {
  tree: GitHubTreeItem[]
  truncated: boolean
}

export async function getManifestFromRepo(
  owner: string,
  repo: string,
  auth?: string,
  branch = 'master'
): Promise<IToolRelease[]> {
  let releases: IToolRelease[] = []
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`

  const http: httpm.HttpClient = new httpm.HttpClient('tool-cache')
  const headers: OutgoingHttpHeaders = {}
  if (auth) {
    core.debug('set auth')
    headers.authorization = auth
  }

  const response = await http.getJson<GitHubTree>(treeUrl, headers)
  if (!response.result) {
    return releases
  }

  let manifestUrl = ''
  for (const item of response.result.tree) {
    if (item.path === 'versions-manifest.json') {
      manifestUrl = item.url
      break
    }
  }

  headers['accept'] = 'application/vnd.github.VERSION.raw'
  let versionsRaw = await (await http.get(manifestUrl, headers)).readBody()

  if (versionsRaw) {
    // shouldn't be needed but protects against invalid json saved with BOM
    versionsRaw = versionsRaw.replace(/^\uFEFF/, '')
    try {
      releases = JSON.parse(versionsRaw)
    } catch {
      core.debug('Invalid json')
    }
  }

  return releases
}

export async function findFromManifest(
  versionSpec: string,
  stable: boolean,
  manifest: IToolRelease[],
  archFilter: string = os.arch()
): Promise<IToolRelease | undefined> {
  // wrap the internal impl
  const match: mm.IToolRelease | undefined = await mm._findMatch(
    versionSpec,
    stable,
    manifest,
    archFilter
  )

  return match
}

async function _createExtractFolder(dest?: string): Promise<string> {
  if (!dest) {
    // create a temp dir
    dest = path.join(_getTempDirectory(), uuidV4())
  }
  await io.mkdirP(dest)
  return dest
}

async function _createToolPath(
  tool: string,
  version: string,
  arch?: string
): Promise<string> {
  const folderPath = path.join(
    _getCacheDirectory(),
    tool,
    semver.clean(version) || version,
    arch || ''
  )
  core.debug(`destination ${folderPath}`)
  const markerPath = `${folderPath}.complete`
  await io.rmRF(folderPath)
  await io.rmRF(markerPath)
  await io.mkdirP(folderPath)
  return folderPath
}

function _completeToolPath(tool: string, version: string, arch?: string): void {
  const folderPath = path.join(
    _getCacheDirectory(),
    tool,
    semver.clean(version) || version,
    arch || ''
  )
  const markerPath = `${folderPath}.complete`
  fs.writeFileSync(markerPath, '')
  core.debug('finished caching tool')
}

/**
 * Check if version string is explicit
 *
 * @param versionSpec      version string to check
 */
export function isExplicitVersion(versionSpec: string): boolean {
  const c = semver.clean(versionSpec) || ''
  core.debug(`isExplicit: ${c}`)

  const valid = semver.valid(c) != null
  core.debug(`explicit? ${valid}`)

  return valid
}

/**
 * Get the highest satisfiying semantic version in `versions` which satisfies `versionSpec`
 *
 * @param versions        array of versions to evaluate
 * @param versionSpec     semantic version spec to satisfy
 */

export function evaluateVersions(
  versions: string[],
  versionSpec: string
): string {
  let version = ''
  core.debug(`evaluating ${versions.length} versions`)
  versions = versions.sort((a, b) => {
    if (semver.gt(a, b)) {
      return 1
    }
    return -1
  })
  for (let i = versions.length - 1; i >= 0; i--) {
    const potential: string = versions[i]
    const satisfied: boolean = semver.satisfies(potential, versionSpec)
    if (satisfied) {
      version = potential
      break
    }
  }

  if (version) {
    core.debug(`matched: ${version}`)
  } else {
    core.debug('match not found')
  }

  return version
}

/**
 * Gets RUNNER_TOOL_CACHE
 */
function _getCacheDirectory(): string {
  const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || ''
  ok(cacheDirectory, 'Expected RUNNER_TOOL_CACHE to be defined')
  return cacheDirectory
}

/**
 * Gets RUNNER_TEMP
 */
function _getTempDirectory(): string {
  const tempDirectory = process.env['RUNNER_TEMP'] || ''
  ok(tempDirectory, 'Expected RUNNER_TEMP to be defined')
  return tempDirectory
}

/**
 * Gets a global variable
 */
function _getGlobal<T>(key: string, defaultValue: T): T {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const value = (global as any)[key] as T | undefined
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return value !== undefined ? value : defaultValue
}

/**
 * Returns an array of unique values.
 * @param values Values to make unique.
 */
function _unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}
