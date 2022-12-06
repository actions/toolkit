import {ok} from 'assert'
import * as childProcess from 'child_process'
import * as path from 'path'
import {promisify} from 'util'
import * as ioUtil from './io-util'

const exec = promisify(childProcess.exec)
const execFile = promisify(childProcess.execFile)

/**
 * Interface for cp/mv options
 */
export interface CopyOptions {
  /** Optional. Whether to recursively copy all subdirectories. Defaults to false */
  recursive?: boolean
  /** Optional. Whether to overwrite existing files in the destination. Defaults to true */
  force?: boolean
  /** Optional. Whether to copy the source directory along with all the files. Only takes effect when recursive=true and copying a directory. Default is true*/
  copySourceDirectory?: boolean
}

/**
 * Interface for cp/mv options
 */
export interface MoveOptions {
  /** Optional. Whether to overwrite existing files in the destination. Defaults to true */
  force?: boolean
}

/**
 * Copies a file or folder.
 * Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
export async function cp(
  source: string,
  dest: string,
  options: CopyOptions = {}
): Promise<void> {
  const {force, recursive, copySourceDirectory} = readCopyOptions(options)

  const destStat = (await ioUtil.exists(dest)) ? await ioUtil.stat(dest) : null
  // Dest is an existing file, but not forcing
  if (destStat && destStat.isFile() && !force) {
    return
  }

  // If dest is an existing directory, should copy inside.
  const newDest: string =
    destStat && destStat.isDirectory() && copySourceDirectory
      ? path.join(dest, path.basename(source))
      : dest

  if (!(await ioUtil.exists(source))) {
    throw new Error(`no such file or directory: ${source}`)
  }
  const sourceStat = await ioUtil.stat(source)

  if (sourceStat.isDirectory()) {
    if (!recursive) {
      throw new Error(
        `Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`
      )
    } else {
      await cpDirRecursive(source, newDest, 0, force)
    }
  } else {
    if (path.relative(source, newDest) === '') {
      // a file cannot be copied to itself
      throw new Error(`'${newDest}' and '${source}' are the same file`)
    }

    await copyFile(source, newDest, force)
  }
}

/**
 * Moves a path.
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See MoveOptions.
 */
export async function mv(
  source: string,
  dest: string,
  options: MoveOptions = {}
): Promise<void> {
  if (await ioUtil.exists(dest)) {
    let destExists = true
    if (await ioUtil.isDirectory(dest)) {
      // If dest is directory copy src into dest
      dest = path.join(dest, path.basename(source))
      destExists = await ioUtil.exists(dest)
    }

    if (destExists) {
      if (options.force == null || options.force) {
        await rmRF(dest)
      } else {
        throw new Error('Destination already exists')
      }
    }
  }
  await mkdirP(path.dirname(dest))
  await ioUtil.rename(source, dest)
}

/**
 * Remove a path recursively with force
 *
 * @param inputPath path to remove
 */
export async function rmRF(inputPath: string): Promise<void> {
  if (ioUtil.IS_WINDOWS) {
    // Node doesn't provide a delete operation, only an unlink function. This means that if the file is being used by another
    // program (e.g. antivirus), it won't be deleted. To address this, we shell out the work to rd/del.

    // Check for invalid characters
    // https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file
    if (/[*"<>|]/.test(inputPath)) {
      throw new Error(
        'File path must not contain `*`, `"`, `<`, `>` or `|` on Windows'
      )
    }
    try {
      const cmdPath = ioUtil.getCmdPath()
      if (await ioUtil.isDirectory(inputPath, true)) {
        await exec(`${cmdPath} /s /c "rd /s /q "%inputPath%""`, {
          env: {inputPath}
        })
      } else {
        await exec(`${cmdPath} /s /c "del /f /a "%inputPath%""`, {
          env: {inputPath}
        })
      }
    } catch (err) {
      // if you try to delete a file that doesn't exist, desired result is achieved
      // other errors are valid
      if (err.code !== 'ENOENT') throw err
    }

    // Shelling out fails to remove a symlink folder with missing source, this unlink catches that
    try {
      await ioUtil.unlink(inputPath)
    } catch (err) {
      // if you try to delete a file that doesn't exist, desired result is achieved
      // other errors are valid
      if (err.code !== 'ENOENT') throw err
    }
  } else {
    let isDir = false
    try {
      isDir = await ioUtil.isDirectory(inputPath)
    } catch (err) {
      // if you try to delete a file that doesn't exist, desired result is achieved
      // other errors are valid
      if (err.code !== 'ENOENT') throw err
      return
    }

    if (isDir) {
      await execFile(`rm`, [`-rf`, `${inputPath}`])
    } else {
      await ioUtil.unlink(inputPath)
    }
  }
}

/**
 * Make a directory.  Creates the full path with folders in between
 * Will throw if it fails
 *
 * @param   fsPath        path to create
 * @returns Promise<void>
 */
export async function mkdirP(fsPath: string): Promise<void> {
  ok(fsPath, 'a path argument must be provided')
  await ioUtil.mkdir(fsPath, {recursive: true})
}

/**
 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
 * If you check and the tool does not exist, it will throw.
 *
 * @param     tool              name of the tool
 * @param     check             whether to check if tool exists
 * @returns   Promise<string>   path to tool
 */
export async function which(tool: string, check?: boolean): Promise<string> {
  if (!tool) {
    throw new Error("parameter 'tool' is required")
  }

  // recursive when check=true
  if (check) {
    const result: string = await which(tool, false)

    if (!result) {
      if (ioUtil.IS_WINDOWS) {
        throw new Error(
          `Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`
        )
      } else {
        throw new Error(
          `Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`
        )
      }
    }

    return result
  }

  const matches: string[] = await findInPath(tool)

  if (matches && matches.length > 0) {
    return matches[0]
  }

  return ''
}

/**
 * Returns a list of all occurrences of the given tool on the system path.
 *
 * @returns   Promise<string[]>  the paths of the tool
 */
export async function findInPath(tool: string): Promise<string[]> {
  if (!tool) {
    throw new Error("parameter 'tool' is required")
  }

  // build the list of extensions to try
  const extensions: string[] = []
  if (ioUtil.IS_WINDOWS && process.env['PATHEXT']) {
    for (const extension of process.env['PATHEXT'].split(path.delimiter)) {
      if (extension) {
        extensions.push(extension)
      }
    }
  }

  // if it's rooted, return it if exists. otherwise return empty.
  if (ioUtil.isRooted(tool)) {
    const filePath: string = await ioUtil.tryGetExecutablePath(tool, extensions)

    if (filePath) {
      return [filePath]
    }

    return []
  }

  // if any path separators, return empty
  if (tool.includes(path.sep)) {
    return []
  }

  // build the list of directories
  //
  // Note, technically "where" checks the current directory on Windows. From a toolkit perspective,
  // it feels like we should not do this. Checking the current directory seems like more of a use
  // case of a shell, and the which() function exposed by the toolkit should strive for consistency
  // across platforms.
  const directories: string[] = []

  if (process.env.PATH) {
    for (const p of process.env.PATH.split(path.delimiter)) {
      if (p) {
        directories.push(p)
      }
    }
  }

  // find all matches
  const matches: string[] = []

  for (const directory of directories) {
    const filePath = await ioUtil.tryGetExecutablePath(
      path.join(directory, tool),
      extensions
    )
    if (filePath) {
      matches.push(filePath)
    }
  }

  return matches
}

function readCopyOptions(options: CopyOptions): Required<CopyOptions> {
  const force = options.force == null ? true : options.force
  const recursive = Boolean(options.recursive)
  const copySourceDirectory =
    options.copySourceDirectory == null
      ? true
      : Boolean(options.copySourceDirectory)
  return {force, recursive, copySourceDirectory}
}

async function cpDirRecursive(
  sourceDir: string,
  destDir: string,
  currentDepth: number,
  force: boolean
): Promise<void> {
  // Ensure there is not a run away recursive copy
  if (currentDepth >= 255) return
  currentDepth++

  await mkdirP(destDir)

  const files: string[] = await ioUtil.readdir(sourceDir)

  for (const fileName of files) {
    const srcFile = `${sourceDir}/${fileName}`
    const destFile = `${destDir}/${fileName}`
    const srcFileStat = await ioUtil.lstat(srcFile)

    if (srcFileStat.isDirectory()) {
      // Recurse
      await cpDirRecursive(srcFile, destFile, currentDepth, force)
    } else {
      await copyFile(srcFile, destFile, force)
    }
  }

  // Change the mode for the newly created directory
  await ioUtil.chmod(destDir, (await ioUtil.stat(sourceDir)).mode)
}

// Buffered file copy
async function copyFile(
  srcFile: string,
  destFile: string,
  force: boolean
): Promise<void> {
  if ((await ioUtil.lstat(srcFile)).isSymbolicLink()) {
    // unlink/re-link it
    try {
      await ioUtil.lstat(destFile)
      await ioUtil.unlink(destFile)
    } catch (e) {
      // Try to override file permission
      if (e.code === 'EPERM') {
        await ioUtil.chmod(destFile, '0666')
        await ioUtil.unlink(destFile)
      }
      // other errors = it doesn't exist, no work to do
    }

    // Copy over symlink
    const symlinkFull: string = await ioUtil.readlink(srcFile)
    await ioUtil.symlink(
      symlinkFull,
      destFile,
      ioUtil.IS_WINDOWS ? 'junction' : null
    )
  } else if (!(await ioUtil.exists(destFile)) || force) {
    await ioUtil.copyFile(srcFile, destFile)
  }
}
