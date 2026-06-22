import {exec} from '@actions/exec'
import * as core from '@actions/core'
import * as io from '@actions/io'
import {existsSync, writeFileSync, unlinkSync} from 'fs'
import * as os from 'os'
import * as crypto from 'crypto'
import * as path from 'path'
import * as utils from './cacheUtils.js'
import {ArchiveTool} from './contracts.js'
import {
  CompressionMethod,
  SystemTarPathOnWindows,
  ArchiveToolType,
  TarFilename,
  ManifestFilename
} from './constants.js'
import {CacheIntegrityError} from './cacheIntegrityError.js'
import {listAndValidate} from './listAndValidate.js'
import {
  PathValidationMode,
  PathValidationViolation,
  deriveAllowedRoots,
  formatViolationSummary,
  getWorkingDirectory
} from './pathValidation.js'

const IS_WINDOWS = process.platform === 'win32'

// Returns tar path and type: BSD or GNU
async function getTarPath(): Promise<ArchiveTool> {
  switch (process.platform) {
    case 'win32': {
      const gnuTar = await utils.getGnuTarPathOnWindows()
      const systemTar = SystemTarPathOnWindows
      if (gnuTar) {
        // Use GNUtar as default on windows
        return <ArchiveTool>{path: gnuTar, type: ArchiveToolType.GNU}
      } else if (existsSync(systemTar)) {
        return <ArchiveTool>{path: systemTar, type: ArchiveToolType.BSD}
      }
      break
    }
    case 'darwin': {
      const gnuTar = await io.which('gtar', false)
      if (gnuTar) {
        // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
        return <ArchiveTool>{path: gnuTar, type: ArchiveToolType.GNU}
      } else {
        return <ArchiveTool>{
          path: await io.which('tar', true),
          type: ArchiveToolType.BSD
        }
      }
    }
    default:
      break
  }
  // Default assumption is GNU tar is present in path
  return <ArchiveTool>{
    path: await io.which('tar', true),
    type: ArchiveToolType.GNU
  }
}

// Return arguments for tar as per tarPath, compressionMethod, method type and os
async function getTarArgs(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod,
  type: string,
  archivePath = '',
  allowListPath = ''
): Promise<string[]> {
  const args = [`"${tarPath.path}"`]
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const tarFile = 'cache.tar'
  const workingDirectory = getWorkingDirectory()
  // Speficic args for BSD tar on windows for workaround
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  // Method specific args
  switch (type) {
    case 'create':
      args.push(
        '--posix',
        '-cf',
        BSD_TAR_ZSTD
          ? tarFile
          : cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '--exclude',
        BSD_TAR_ZSTD
          ? tarFile
          : cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P',
        '-C',
        workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '--files-from',
        ManifestFilename
      )
      break
    case 'extract':
      args.push(
        '-xf',
        BSD_TAR_ZSTD
          ? tarFile
          : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P',
        '-C',
        workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
      )
      // When an extraction allow-list is supplied (pathValidation: 'error'
      // with a clean archive), restrict extraction to exactly the members the
      // validator approved, matched by the names node-tar derived from the
      // same bytes. This makes the extraction parser's view of any
      // path-channel parser differential a no-op: a member system tar would
      // place at a different path than node-tar simply isn't on the list.
      //
      // `--null` MUST precede `-T` on GNU tar (otherwise the list is read
      // newline-delimited with stray NULs). `--no-recursion` stops an
      // approved directory from implicitly pulling in unapproved children.
      // The `--no-wildcards*` / `--anchored` flags are GNU-only defence in
      // depth; bsdtar lacks them but glob metacharacters are already rejected
      // during validation, so its `fnmatch()`-based `-T` matching degrades to
      // exact-name matching.
      if (allowListPath) {
        args.push('--null', '--no-recursion')
        if (tarPath.type === ArchiveToolType.GNU) {
          args.push(
            '--no-wildcards',
            '--no-wildcards-match-slash',
            '--anchored'
          )
        }
        args.push(
          '-T',
          `"${allowListPath.replace(new RegExp(`\\${path.sep}`, 'g'), '/')}"`
        )
      }
      break
    case 'list':
      args.push(
        '-tf',
        BSD_TAR_ZSTD
          ? tarFile
          : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
        '-P'
      )
      break
  }

  // Platform specific args
  if (tarPath.type === ArchiveToolType.GNU) {
    switch (process.platform) {
      case 'win32':
        args.push('--force-local')
        break
      case 'darwin':
        args.push('--delay-directory-restore')
        break
    }
  }

  return args
}

// Returns commands to run tar and compression program
async function getCommands(
  compressionMethod: CompressionMethod,
  type: string,
  archivePath = '',
  allowListPath = ''
): Promise<string[]> {
  let args

  const tarPath = await getTarPath()
  const tarArgs = await getTarArgs(
    tarPath,
    compressionMethod,
    type,
    archivePath,
    allowListPath
  )
  const compressionArgs =
    type !== 'create'
      ? await getDecompressionProgram(tarPath, compressionMethod, archivePath)
      : await getCompressionProgram(tarPath, compressionMethod)
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS

  if (BSD_TAR_ZSTD && type !== 'create') {
    args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')]
  } else {
    args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')]
  }

  if (BSD_TAR_ZSTD) {
    return args
  }

  return [args.join(' ')]
}

// Common function for extractTar and listTar to get the compression method
async function getDecompressionProgram(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod,
  archivePath: string
): Promise<string[]> {
  // -d: Decompress.
  // unzstd is equivalent to 'zstd -d'
  // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
  // Using 30 here because we also support 32-bit self-hosted runners.
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --long=30 --force -o',
            TarFilename,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? '"zstd -d --long=30"' : 'unzstd --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? [
            'zstd -d --force -o',
            TarFilename,
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
          ]
        : ['--use-compress-program', IS_WINDOWS ? '"zstd -d"' : 'unzstd']
    default:
      return ['-z']
  }
}

// Used for creating the archive
// -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
// zstdmt is equivalent to 'zstd -T0'
// --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
// Using 30 here because we also support 32-bit self-hosted runners.
// Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
async function getCompressionProgram(
  tarPath: ArchiveTool,
  compressionMethod: CompressionMethod
): Promise<string[]> {
  const cacheFileName = utils.getCacheFileName(compressionMethod)
  const BSD_TAR_ZSTD =
    tarPath.type === ArchiveToolType.BSD &&
    compressionMethod !== CompressionMethod.Gzip &&
    IS_WINDOWS
  switch (compressionMethod) {
    case CompressionMethod.Zstd:
      return BSD_TAR_ZSTD
        ? [
            'zstd -T0 --long=30 --force -o',
            cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            TarFilename
          ]
        : [
            '--use-compress-program',
            IS_WINDOWS ? '"zstd -T0 --long=30"' : 'zstdmt --long=30'
          ]
    case CompressionMethod.ZstdWithoutLong:
      return BSD_TAR_ZSTD
        ? [
            'zstd -T0 --force -o',
            cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            TarFilename
          ]
        : ['--use-compress-program', IS_WINDOWS ? '"zstd -T0"' : 'zstdmt']
    default:
      return ['-z']
  }
}

// Executes all commands as separate processes
async function execCommands(commands: string[], cwd?: string): Promise<void> {
  for (const command of commands) {
    try {
      await exec(command, undefined, {
        cwd,
        env: {...(process.env as object), MSYS: 'winsymlinks:nativestrict'}
      })
    } catch (error) {
      throw new Error(
        `${command.split(' ')[0]} failed with error: ${error?.message}`
      )
    }
  }
}

// List the contents of a tar
export async function listTar(
  archivePath: string,
  compressionMethod: CompressionMethod
): Promise<void> {
  const commands = await getCommands(compressionMethod, 'list', archivePath)
  await execCommands(commands)
}

// Extract a tar
export async function extractTar(
  archivePath: string,
  compressionMethod: CompressionMethod,
  options?: {
    declaredPaths?: string[]
    pathValidation?: PathValidationMode
  }
): Promise<void> {
  const workingDirectory = getWorkingDirectory()
  const pathValidation: PathValidationMode = options?.pathValidation ?? 'off'

  // Names approved for extraction by the validator. When pathValidation is
  // 'error' and the archive is clean, system tar is restricted to exactly
  // these members via a NUL-separated `-T` allow-list (see below).
  let approvedNames: string[] | undefined

  // Run path validation BEFORE creating the extraction directory or invoking
  // system tar. In 'error' mode, a CacheIntegrityError thrown here means no
  // bytes are ever written to the workspace. In 'warn' mode, violations are
  // logged and extraction proceeds.
  if (pathValidation !== 'off') {
    const declaredPaths = options?.declaredPaths ?? []
    let allowedRoots = deriveAllowedRoots(declaredPaths, workingDirectory)
    // Fail-safe: if the caller didn't supply any declared paths (or all
    // supplied paths were empty/negations), fall back to the workspace
    // root as the sole allowed root. This still catches archives that try
    // to escape the workspace via `..` or absolute paths.
    if (allowedRoots.length === 0) {
      allowedRoots = [workingDirectory]
    }
    let violations: PathValidationViolation[] | undefined
    try {
      const result = await listAndValidate(
        archivePath,
        compressionMethod,
        allowedRoots,
        workingDirectory
      )
      violations = result.violations
      approvedNames = result.approvedNames
    } catch (error) {
      // Parse / decompression failure encountered while validating. The
      // validator's tar parser is stricter than the system `tar` that
      // performs the actual extraction, so an archive can fail validation
      // here yet still extract cleanly. Honor the caller's mode:
      //   - 'error': hard-fail; do not extract.
      //   - 'warn': log a warning, skip validation, and let system tar
      //             have a go. This preserves the legacy behavior where a
      //             quirky-but-extractable archive doesn't break the build
      //             just because the user opted into validation.
      const message = `Cache archive integrity check failed: ${
        (error as Error).message
      }`
      if (pathValidation === 'error') {
        throw new CacheIntegrityError('PARSE_ERROR', message)
      }
      core.warning(
        `${message}\nSkipping path validation and proceeding with extraction because pathValidation is 'warn'.`
      )
    }
    if (violations && violations.length > 0) {
      reportViolations(violations, pathValidation)
      if (pathValidation === 'error') {
        throw new CacheIntegrityError(
          'PATH_VIOLATION',
          `Cache archive contains ${violations.length} entr${
            violations.length === 1 ? 'y' : 'ies'
          } that resolve outside the declared cache paths. ` +
            `Refusing to extract because pathValidation is 'error'.`,
          violations
        )
      }
      // In 'warn' mode a violation means we must NOT restrict extraction to
      // the (possibly incomplete) approved list — fall back to extracting
      // everything, matching legacy behavior.
      approvedNames = undefined
    }
  }

  // Create directory to extract tar into
  await io.mkdirP(workingDirectory)

  // In 'error' mode with a clean archive, write the approved member names to a
  // NUL-separated allow-list and restrict system tar to exactly those members.
  // This closes path-channel parser differentials: a member tar would extract
  // to an escaped path is not on the list, so it is never extracted.
  let allowListPath = ''
  if (pathValidation === 'error' && approvedNames !== undefined) {
    allowListPath = writeAllowList(approvedNames)
  }

  try {
    const commands = await getCommands(
      compressionMethod,
      'extract',
      archivePath,
      allowListPath
    )
    await execCommands(commands)
  } finally {
    if (allowListPath) {
      try {
        unlinkSync(allowListPath)
      } catch {
        // best-effort cleanup of the temporary allow-list file
      }
    }
  }
}

/**
 * Write the approved member names to a temporary NUL-separated file suitable
 * for `tar --null -T`. Returns the absolute path to the written file. The
 * caller is responsible for unlinking it.
 */
function writeAllowList(approvedNames: string[]): string {
  const allowListPath = path.join(
    os.tmpdir(),
    `cache-allow-${process.pid}-${Date.now()}-${crypto
      .randomBytes(8)
      .toString('hex')}.lst`
  )
  // Write each approved name exactly as node-tar derived it from the archive
  // bytes. That is the same name system tar reads from the archive header, so
  // an anchored `-T` match succeeds for every member without us second-guessing
  // tar's name handling. In particular we must NOT strip a leading `./`: GNU
  // tar matches `-T` names anchored and exact and keeps the `./`, so a
  // `cache/f` pattern does not match a `./cache/f` member (it fails with
  // "Not found in archive", exit code 2) whereas the verbatim `./cache/f`
  // matches and extracts to `cache/f`.
  const payload = Buffer.concat(
    approvedNames.flatMap(name => [Buffer.from(name, 'utf8'), Buffer.from([0])])
  )
  // `flag: 'wx'` (O_CREAT | O_EXCL | O_WRONLY) makes the open fail if the path
  // already exists, so a file or symlink pre-planted at the (randomized) temp
  // path on a shared/self-hosted runner cannot redirect or capture the write.
  // mode 0o600 keeps the list readable only by the current user. Both options
  // behave consistently on Windows, macOS and Linux.
  writeFileSync(allowListPath, payload, {mode: 0o600, flag: 'wx'})
  return allowListPath
}

function reportViolations(
  violations: PathValidationViolation[],
  mode: PathValidationMode
): void {
  const header =
    mode === 'error'
      ? `Cache archive failed integrity check (${violations.length} violation${
          violations.length === 1 ? '' : 's'
        }).`
      : `Cache archive contains ${violations.length} entr${
          violations.length === 1 ? 'y' : 'ies'
        } that resolve outside the declared cache paths.`
  // One-line warning so the Actions log surfaces a single attention-grabbing
  // entry. The truncated, human-readable list goes to `core.info` so users see
  // it at default verbosity without us emitting multi-line warnings (which
  // some log surfaces collapse). Full per-violation details still go to
  // `core.debug` for triage of large archives.
  core.warning(header)
  core.info(formatViolationSummary(violations))
  for (const v of violations) {
    core.debug(
      `path-validation: code=${v.code} type=${v.entryType} path=${v.path}${
        v.linkpath ? ` linkpath=${v.linkpath}` : ''
      } resolved=${v.resolved} reason=${v.reason}`
    )
  }
}

// Create a tar
export async function createTar(
  archiveFolder: string,
  sourceDirectories: string[],
  compressionMethod: CompressionMethod
): Promise<void> {
  // Write source directories to manifest.txt to avoid command length limits
  writeFileSync(
    path.join(archiveFolder, ManifestFilename),
    sourceDirectories.join('\n')
  )
  const commands = await getCommands(compressionMethod, 'create')
  await execCommands(commands, archiveFolder)
}
