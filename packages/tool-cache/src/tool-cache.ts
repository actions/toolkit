import * as core from '@actions/core'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as httpm from 'typed-rest-client/HttpClient'
import * as semver from 'semver'
import * as uuidV4 from 'uuid/v4'
import {exec} from '@actions/exec/lib/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import {ok} from 'assert'

class HTTPError extends Error {
  constructor(readonly httpStatusCode: number | undefined) {
    super(`Unexpected HTTP response: ${httpStatusCode}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

const IS_WINDOWS = process.platform === 'win32'
const userAgent = 'actions/tool-cache'

// On load grab temp directory and cache directory and remove them from env (currently don't want to expose this)
let tempDirectory: string = process.env['RUNNER_TEMPDIRECTORY'] || ''
let cacheRoot: string = process.env['RUNNER_TOOLSDIRECTORY'] || ''
process.env['RUNNER_TEMPDIRECTORY'] = ''
process.env['RUNNER_TOOLSDIRECTORY'] = ''
// If directories not found, place them in common temp locations
if (!tempDirectory || !cacheRoot) {
  let baseLocation: string
  if (IS_WINDOWS) {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env['USERPROFILE'] || 'C:\\'
  } else {
    if (process.platform === 'darwin') {
      baseLocation = '/Users'
    } else {
      baseLocation = '/home'
    }
  }
  if (!tempDirectory) {
    tempDirectory = path.join(baseLocation, 'actions', 'temp')
  }
  if (!cacheRoot) {
    cacheRoot = path.join(baseLocation, 'actions', 'cache')
  }
}

/**
 * Download a tool from an url and stream it into a file
 *
 * @param url       url of tool to download
 * @returns         path to downloaded tool
 */
export async function downloadTool(url: string): Promise<string> {
  // Wrap in a promise so that we can resolve from within stream callbacks
  return new Promise<string>(async (resolve, reject) => {
    try {
      const http = new httpm.HttpClient(userAgent, [], {
        allowRetries: true,
        maxRetries: 3
      })
      const destPath = path.join(tempDirectory, uuidV4())

      await io.mkdirP(tempDirectory)
      core.debug(`Downloading ${url}`)
      core.debug(`Downloading ${destPath}`)

      if (fs.existsSync(destPath)) {
        throw new Error(`Destination file path ${destPath} already exists`)
      }

      const response: httpm.HttpClientResponse = await http.get(url)

      if (response.message.statusCode !== 200) {
        const err = new HTTPError(response.message.statusCode)
        core.debug(
          `Failed to download from "${url}". Code(${
            response.message.statusCode
          }) Message(${response.message.statusMessage})`
        )
        throw err
      }

      const file: NodeJS.WritableStream = fs.createWriteStream(destPath)
      file.on('open', async () => {
        try {
          const stream = response.message.pipe(file)
          stream.on('close', () => {
            core.debug('download complete')
            resolve(destPath)
          })
        } catch (err) {
          core.debug(
            `Failed to download from "${url}". Code(${
              response.message.statusCode
            }) Message(${response.message.statusMessage})`
          )
          reject(err)
        }
      })
      file.on('error', err => {
        file.end()
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Extract a .7z file
 *
 * @param file     path to the .7z file
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extract7z(file: string, dest?: string): Promise<string> {
  ok(IS_WINDOWS, 'extract7z() not supported on current OS')
  ok(file, 'parameter "file" is required')

  dest = dest || (await _createExtractFolder(dest))

  const originalCwd = process.cwd()
  process.chdir(dest)
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

  return dest
}

/**
 * Extract a tar
 *
 * @param file     path to the tar
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extractTar(file: string, dest?: string): Promise<string> {
  if (!file) {
    throw new Error("parameter 'file' is required")
  }

  dest = dest || (await _createExtractFolder(dest))
  const tarPath: string = await io.which('tar', true)
  await exec(`"${tarPath}"`, ['xzC', dest, '-f', file])

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

  dest = dest || (await _createExtractFolder(dest))

  if (IS_WINDOWS) {
    // build the powershell command
    const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, '') // double-up single quotes, remove double quotes and newlines
    const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '')
    const command = `$ErrorActionPreference = 'Stop' ; try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ; [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}')`

    // run powershell
    const powershellPath = await io.which('powershell')
    const args = [
      '-NoLogo',
      '-Sta',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Unrestricted',
      '-Command',
      command
    ]
    await exec(`"${powershellPath}"`, args)
  } else {
    const unzipPath = path.join(
      __dirname,
      '..',
      'scripts',
      'externals',
      'unzip'
    )
    await exec(`"${unzipPath}"`, [file], {cwd: dest})
  }

  return dest
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
 * finds the path to a tool in the local installed tool cache
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
  if (!_isExplicitVersion(versionSpec)) {
    const localVersions: string[] = _findLocalToolVersions(toolName, arch)
    const match = _evaluateVersions(localVersions, versionSpec)
    versionSpec = match
  }

  // check for the explicit version in the cache
  let toolPath = ''
  if (versionSpec) {
    versionSpec = semver.clean(versionSpec) || ''
    const cachePath = path.join(cacheRoot, toolName, versionSpec, arch)
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

async function _createExtractFolder(dest?: string): Promise<string> {
  if (!dest) {
    // create a temp dir
    dest = path.join(tempDirectory, uuidV4())
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
    cacheRoot,
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
    cacheRoot,
    tool,
    semver.clean(version) || version,
    arch || ''
  )
  const markerPath = `${folderPath}.complete`
  fs.writeFileSync(markerPath, '')
  core.debug('finished caching tool')
}

function _isExplicitVersion(versionSpec: string): boolean {
  const c = semver.clean(versionSpec) || ''
  core.debug(`isExplicit: ${c}`)

  const valid = semver.valid(c) != null
  core.debug(`explicit? ${valid}`)

  return valid
}

function _evaluateVersions(versions: string[], versionSpec: string): string {
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

function _findLocalToolVersions(toolName: string, arch?: string): string[] {
  const versions: string[] = []

  arch = arch || os.arch()
  const toolPath = path.join(cacheRoot, toolName)

  if (fs.existsSync(toolPath)) {
    const children: string[] = fs.readdirSync(toolPath)
    for (const child of children) {
      if (_isExplicitVersion(child)) {
        const fullPath = path.join(toolPath, child, arch || '')
        if (fs.existsSync(fullPath) && fs.existsSync(`${fullPath}.complete`)) {
          versions.push(child)
        }
      }
    }
  }

  return versions
}
