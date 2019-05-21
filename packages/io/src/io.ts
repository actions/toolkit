import childProcess = require('child_process')
import fs = require('fs')
import path = require('path')
import util = require('./ioUtil')

/**
 * Interface for cp/mv options
 */
export interface CopyOptions {
  /** Optional. Whether to recursively copy all subdirectories. Defaults to false */
  recursive?: boolean
  /** Optional. Whether to overwrite existing files in the destination. Defaults to true */
  force?: boolean
}

/**
 * Copies a file or folder.
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
export function cp(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<void> {
  let force = true
  let recursive = false
  if (options) {
    if (options.recursive) {
      recursive = true
    }
    if (options.force === false) {
      force = false
    }
  }
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (fs.lstatSync(source).isDirectory()) {
        if (!recursive) {
          throw new Error(`non-recursive cp failed, ${source} is a directory`)
        }

        // If directory exists, copy source inside it. Otherwise, create it and copy contents of source inside.
        if (fs.existsSync(dest)) {
          if (!fs.lstatSync(dest).isDirectory()) {
            throw new Error(`${dest} is not a directory`)
          }

          dest = path.join(dest, path.basename(source))
        }

        copyDirectoryContents(source, dest, force)
      } else {
        if (force) {
          fs.copyFileSync(source, dest)
        } else {
          fs.copyFileSync(source, dest, fs.constants.COPYFILE_EXCL)
        }
      }
    } catch (err) {
      reject(err)
      return
    }

    resolve()
  })
}

/**
 * Moves a path.
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
export function mv(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<void> {
  let force = true
  let recursive = false
  if (options) {
    if (options.recursive) {
      recursive = true
    }
    if (options.force === false) {
      force = false
    }
  }
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (fs.lstatSync(source).isDirectory()) {
        if (!recursive) {
          throw new Error(`non-recursive cp failed, ${source} is a directory`)
        }

        // If directory exists, move source inside it. Otherwise, create it and move contents of source inside.
        if (fs.existsSync(dest)) {
          if (!fs.lstatSync(dest).isDirectory()) {
            throw new Error(`${dest} is not a directory`)
          }

          dest = path.join(dest, path.basename(source))
        }

        copyDirectoryContents(source, dest, force, true)
      } else {
        if (force) {
          fs.copyFileSync(source, dest)
        } else {
          fs.copyFileSync(source, dest, fs.constants.COPYFILE_EXCL)
        }

        // Delete file after copying since this is mv.
        fs.unlinkSync(source)
      }
    } catch (err) {
      reject(err)
      return
    }

    resolve()
  })
}

/**
 * Remove a path recursively with force
 *
 * @param     inputPath     path to remove
 */
export function rmRF(inputPath: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    if (process.platform === 'win32') {
      // Node doesn't provide a delete operation, only an unlink function. This means that if the file is being used by another
      // program (e.g. antivirus), it won't be deleted. To address this, we shell out the work to rd/del.
      try {
        if (fs.statSync(inputPath).isDirectory()) {
          childProcess.execSync(`rd /s /q "${inputPath}"`)
        } else {
          childProcess.execSync(`del /f /a "${inputPath}"`)
        }
      } catch (err) {
        // if you try to delete a file that doesn't exist, desired result is achieved
        // other errors are valid
        if (err.code != 'ENOENT') {
          reject(err)
          return
        }
      }

      // Shelling out fails to remove a symlink folder with missing source, this unlink catches that
      try {
        fs.unlinkSync(inputPath)
      } catch (err) {
        // if you try to delete a file that doesn't exist, desired result is achieved
        // other errors are valid
        if (err.code != 'ENOENT') {
          reject(err)
          return
        }
      }
    } else {
      // get the lstats in order to workaround a bug in shelljs@0.3.0 where symlinks
      // with missing targets are not handled correctly by "rm('-rf', path)"
      let isDirectory = false
      try {
        isDirectory = fs.lstatSync(inputPath).isDirectory()
      } catch (err) {
        // if you try to delete a file that doesn't exist, desired result is achieved
        // other errors are valid
        if (err.code == 'ENOENT') {
          resolve()
        } else {
          reject(err)
        }
        return
      }

      if (isDirectory) {
        util._removeDirectory(inputPath)
        resolve()
        return
      } else {
        fs.unlinkSync(inputPath)
      }
    }

    resolve()
  })
}

/**
 * Make a directory.  Creates the full path with folders in between
 * Will throw if it fails
 *
 * @param     p       path to create
 * @returns   Promise<void>
 */
export function mkdirP(p: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!p) {
        throw new Error('Parameter p is required')
      }

      // build a stack of directories to create
      const stack: string[] = []
      let testDir: string = p
      while (true) {
        // validate the loop is not out of control
        if (stack.length >= (process.env['TEST_MKDIRP_FAILSAFE'] || 1000)) {
          // let the framework throw
          fs.mkdirSync(p)
          resolve()
          return
        }

        let stats: fs.Stats
        try {
          stats = fs.statSync(testDir)
        } catch (err) {
          if (err.code == 'ENOENT') {
            // validate the directory is not the drive root
            const parentDir = path.dirname(testDir)
            if (testDir == parentDir) {
              throw new Error(
                `Unable to create directory '${p}'. Root directory does not exist: '${testDir}'`
              )
            }

            // push the dir and test the parent
            stack.push(testDir)
            testDir = parentDir
            continue
          } else if (err.code == 'UNKNOWN') {
            throw new Error(
              `Unable to create directory '${p}'. Unable to verify the directory exists: '${testDir}'. If directory is a file share, please verify the share name is correct, the share is online, and the current process has permission to access the share.`
            )
          } else {
            throw err
          }
        }

        if (!stats.isDirectory()) {
          throw new Error(
            `Unable to create directory '${p}'. Conflicting file exists: '${testDir}'`
          )
        }

        // testDir exists
        break
      }

      // create each directory
      while (stack.length) {
        const dir = stack.pop()! // non-null because `stack.length` was truthy
        fs.mkdirSync(dir)
      }
    } catch (err) {
      reject(err)
      return
    }

    resolve()
  })
}

/**
 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
 * If you check and the tool does not exist, it will throw.
 *
 * @param     tool              name of the tool
 * @param     check             whether to check if tool exists
 * @returns   Promise<string>   path to tool
 */
export function which(tool: string, check?: boolean): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    if (!tool) {
      reject("parameter 'tool' is required")
      return
    }

    // recursive when check=true
    if (check) {
      const result: string = await which(tool, false)
      if (!result) {
        if (process.platform == 'win32') {
          reject(
            `Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`
          )
        } else {
          reject(
            `Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`
          )
        }
        return
      }
    }

    try {
      // build the list of extensions to try
      const extensions: string[] = []
      if (process.platform == 'win32' && process.env['PATHEXT']) {
        for (const extension of process.env['PATHEXT']!.split(path.delimiter)) {
          if (extension) {
            extensions.push(extension)
          }
        }
      }

      // if it's rooted, return it if exists. otherwise return empty.
      if (util._isRooted(tool)) {
        const filePath: string = util._tryGetExecutablePath(tool, extensions)
        if (filePath) {
          resolve(filePath)
          return
        }

        resolve('')
        return
      }

      // if any path separators, return empty
      if (
        tool.indexOf('/') >= 0 ||
        (process.platform == 'win32' && tool.indexOf('\\') >= 0)
      ) {
        resolve('')
        return
      }

      // build the list of directories
      //
      // Note, technically "where" checks the current directory on Windows. From a task lib perspective,
      // it feels like we should not do this. Checking the current directory seems like more of a use
      // case of a shell, and the which() function exposed by the task lib should strive for consistency
      // across platforms.
      const directories: string[] = []
      if (process.env['PATH']) {
        for (const p of process.env['PATH']!.split(path.delimiter)) {
          if (p) {
            directories.push(p)
          }
        }
      }

      // return the first match
      for (const directory of directories) {
        const filePath = util._tryGetExecutablePath(
          directory + path.sep + tool,
          extensions
        )
        if (filePath) {
          resolve(filePath)
          return
        }
      }

      resolve('')
    } catch (err) {
      reject(`which failed with message ${err.message}`)
    }
  })
}

// Copies contents of source into dest, making any necessary folders along the way.
// Deletes the original copy if deleteOriginal is true
function copyDirectoryContents(
  source: string,
  dest: string,
  force: boolean,
  deleteOriginal = false
) {
  if (fs.lstatSync(source).isDirectory()) {
    if (fs.existsSync(dest)) {
      if (!fs.lstatSync(dest).isDirectory()) {
        throw new Error(`${dest} is not a directory`)
      }
    } else {
      mkdirP(dest)
    }

    // Copy all child files, and directories recursively
    const sourceChildren: string[] = fs.readdirSync(source)
    sourceChildren.forEach(newSource => {
      const newDest = path.join(dest, path.basename(newSource))
      copyDirectoryContents(
        path.resolve(source, newSource),
        newDest,
        force,
        deleteOriginal
      )
    })
    if (deleteOriginal) {
      fs.rmdirSync(source)
    }
  } else {
    if (force) {
      fs.copyFileSync(source, dest)
    } else {
      fs.copyFileSync(source, dest, fs.constants.COPYFILE_EXCL)
    }
    if (deleteOriginal) {
      fs.unlinkSync(source)
    }
  }
}
