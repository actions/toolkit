import * as fs from 'fs'
import * as path from 'path'

export async function exists(fsPath: string): Promise<boolean> {
  try {
    await fs.promises.stat(fsPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    throw err
  }

  return true
}

export async function isDirectory(fsPath: string): Promise<boolean> {
  const lstat = await fs.promises.lstat(fsPath)
  return lstat.isDirectory()
}

export async function removeDirectory(directoryPath: string): Promise<void> {
  if (await exists(directoryPath)) {
    for (const fileName of await fs.promises.readdir(directoryPath)) {
      const file = path.join(directoryPath, fileName)
      if (await isDirectory(file)) {
        await removeDirectory(file)
      } else {
        await fs.promises.unlink(file)
      }
    }
  }
  await fs.promises.rmdir(directoryPath)
}

/**
 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
 */
export function isRooted(p: string): boolean {
  p = normalizeSeparators(p)
  if (!p) {
    throw new Error('isRooted() parameter "p" cannot be empty')
  }

  if (process.platform === 'win32') {
    return (
      p.startsWith('\\') || /^[A-Z]:/i.test(p) // e.g. \ or \hello or \\hello
    ) // e.g. C: or C:\hello
  }

  return p.startsWith('/')
}

/**
 * Best effort attempt to determine whether a file exists and is executable.
 * @param filePath    file path to check
 * @param extensions  additional file extensions to try
 * @return if file exists and is executable, returns the file path. otherwise empty string.
 */
export async function tryGetExecutablePath(
  filePath: string,
  extensions: string[]
): Promise<string> {
  try {
    // test file exists
    const stats = await fs.promises.stat(filePath)

    if (stats.isFile()) {
      if (process.platform === 'win32') {
        // on Windows, test for valid extension
        const fileName = path.basename(filePath)
        const dotIndex = fileName.lastIndexOf('.')
        if (dotIndex >= 0) {
          const upperExt = fileName.substr(dotIndex).toUpperCase()
          if (
            extensions.some(validExt => validExt.toUpperCase() === upperExt)
          ) {
            return filePath
          }
        }
      } else {
        if (isUnixExecutable(stats)) {
          return filePath
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.log(
        `Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`
      )
    }
  }

  // try each extension
  const originalFilePath = filePath
  for (const extension of extensions) {
    filePath = originalFilePath + extension
    try {
      const stats = await fs.promises.stat(filePath)

      if (stats.isFile()) {
        if (process.platform === 'win32') {
          // preserve the case of the actual file (since an extension was appended)
          try {
            const directory = path.dirname(filePath)
            const upperName = path.basename(filePath).toUpperCase()
            for (const actualName of await fs.promises.readdir(directory)) {
              if (upperName === actualName.toUpperCase()) {
                filePath = path.join(directory, actualName)
                break
              }
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(
              `Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`
            )
          }

          return filePath
        } else {
          if (isUnixExecutable(stats)) {
            return filePath
          }
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // eslint-disable-next-line no-console
        console.log(
          `Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`
        )
      }
    }
  }

  return ''
}

function normalizeSeparators(p: string): string {
  p = p || ''
  if (process.platform === 'win32') {
    // convert slashes on Windows
    p = p.replace(/\//g, '\\')

    // remove redundant slashes
    const isUnc = /^\\\\+[^\\]/.test(p) // e.g. \\hello
    return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\') // preserve leading // for UNC
  }

  // remove redundant slashes
  return p.replace(/\/\/+/g, '/')
}

// on Mac/Linux, test the execute bit
//     R   W  X  R  W X R W X
//   256 128 64 32 16 8 4 2 1
function isUnixExecutable(stats: fs.Stats): boolean {
  return (
    (stats.mode & 1) > 0 ||
    ((stats.mode & 8) > 0 && stats.gid === process.getgid()) ||
    ((stats.mode & 64) > 0 && stats.uid === process.getuid())
  )
}
