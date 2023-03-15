import * as fs from 'fs'
import * as path from 'path'

export const {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readdir,
  readlink,
  rename,
  rm,
  rmdir,
  stat,
  symlink,
  unlink
} = fs.promises
// export const {open} = 'fs'
export const IS_WINDOWS = process.platform === 'win32'
// See https://github.com/nodejs/node/blob/d0153aee367422d0858105abec186da4dff0a0c5/deps/uv/include/uv/win.h#L691
export const UV_FS_O_EXLOCK = 0x10000000
export const READONLY = fs.constants.O_RDONLY

export async function exists(fsPath: string): Promise<boolean> {
  try {
    await stat(fsPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    throw err
  }

  return true
}

export async function isDirectory(
  fsPath: string,
  useStat = false
): Promise<boolean> {
  const stats = useStat ? await stat(fsPath) : await lstat(fsPath)
  return stats.isDirectory()
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

  if (IS_WINDOWS) {
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
  let stats: fs.Stats | undefined = undefined
  try {
    // test file exists
    stats = await stat(filePath)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.log(
        `Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`
      )
    }
  }
  if (stats && stats.isFile()) {
    if (IS_WINDOWS) {
      // on Windows, test for valid extension
      const upperExt = path.extname(filePath).toUpperCase()
      if (extensions.some(validExt => validExt.toUpperCase() === upperExt)) {
        return filePath
      }
    } else {
      if (isUnixExecutable(stats)) {
        return filePath
      }
    }
  }

  // try each extension
  const originalFilePath = filePath
  for (const extension of extensions) {
    filePath = originalFilePath + extension

    stats = undefined
    try {
      stats = await stat(filePath)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // eslint-disable-next-line no-console
        console.log(
          `Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`
        )
      }
    }

    if (stats && stats.isFile()) {
      if (IS_WINDOWS) {
        // preserve the case of the actual file (since an extension was appended)
        try {
          const directory = path.dirname(filePath)
          const upperName = path.basename(filePath).toUpperCase()
          for (const actualName of await readdir(directory)) {
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
  }

  return ''
}

function normalizeSeparators(p: string): string {
  p = p || ''
  if (IS_WINDOWS) {
    // convert slashes on Windows
    p = p.replace(/\//g, '\\')

    // remove redundant slashes
    return p.replace(/\\\\+/g, '\\')
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

// Get the path of cmd.exe in windows
export function getCmdPath(): string {
  return process.env['COMSPEC'] ?? `cmd.exe`
}
