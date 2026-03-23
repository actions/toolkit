import * as crypto from 'crypto'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'
import * as path from 'path'
import minimatch from 'minimatch'
import {Globber} from './glob.js'
import {HashFileOptions} from './internal-hash-file-options.js'

type IMinimatch = minimatch.IMinimatch
type IMinimatchOptions = minimatch.IOptions
const {Minimatch} = minimatch

const IS_WINDOWS = process.platform === 'win32'
const MAX_WARNED_FILES = 10

const MINIMATCH_OPTIONS: IMinimatchOptions = {
  dot: true,
  nobrace: true,
  nocase: IS_WINDOWS,
  nocomment: true,
  noext: true,
  nonegate: true
}

type ExcludeMatcher = {
  absolutePathMatcher: IMinimatch
  workspaceRelativeMatcher: IMinimatch
}

// Checks if resolvedFile is inside any of resolvedRoots.
function isInResolvedRoots(
  resolvedFile: string,
  resolvedRoots: string[]
): boolean {
  const normalizedFile = IS_WINDOWS ? resolvedFile.toLowerCase() : resolvedFile
  return resolvedRoots.some(root => {
    const normalizedRoot = IS_WINDOWS ? root.toLowerCase() : root
    if (normalizedFile === normalizedRoot) return true
    const rel = path.relative(normalizedRoot, normalizedFile)
    return (
      !path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`)
    )
  })
}

function normalizeForMatch(p: string): string {
  return p.split(path.sep).join('/')
}

function buildExcludeMatchers(excludePatterns: string[]): ExcludeMatcher[] {
  return excludePatterns.map(pattern => {
    const normalizedPattern = normalizeForMatch(pattern)
    // basename-only pattern (no "/") uses matchBase so "*.log" matches anywhere
    const isBasenamePattern = !normalizedPattern.includes('/')
    return {
      absolutePathMatcher: new Minimatch(normalizedPattern, {
        ...MINIMATCH_OPTIONS,
        matchBase: false
      } as IMinimatchOptions),
      workspaceRelativeMatcher: new Minimatch(normalizedPattern, {
        ...MINIMATCH_OPTIONS,
        matchBase: isBasenamePattern
      } as IMinimatchOptions)
    }
  })
}

function isExcluded(
  resolvedFile: string,
  excludeMatchers: ExcludeMatcher[],
  githubWorkspace: string
): boolean {
  if (excludeMatchers.length === 0) return false
  const absolutePath = path.resolve(resolvedFile)
  const absolutePathForMatch = normalizeForMatch(absolutePath)
  const workspaceRelativePathForMatch = normalizeForMatch(
    path.relative(githubWorkspace, absolutePath)
  )
  return excludeMatchers.some(
    m =>
      m.absolutePathMatcher.match(absolutePathForMatch) ||
      m.workspaceRelativeMatcher.match(workspaceRelativePathForMatch)
  )
}

export async function hashFiles(
  globber: Globber,
  currentWorkspace: string,
  options?: HashFileOptions,
  verbose: Boolean = false
): Promise<string> {
  const writeDelegate = verbose ? core.info : core.debug
  const githubWorkspace = currentWorkspace
    ? currentWorkspace
    : (process.env['GITHUB_WORKSPACE'] ?? process.cwd())
  const allowOutside = options?.allowFilesOutsideWorkspace ?? false
  const excludeMatchers = buildExcludeMatchers(options?.exclude ?? [])

  // Resolve roots up front; warn and skip any that fail to resolve
  const resolvedRoots: string[] = []
  for (const root of options?.roots ?? [githubWorkspace]) {
    try {
      resolvedRoots.push(fs.realpathSync(root))
    } catch (err) {
      core.warning(`Could not resolve root '${root}': ${err}`)
    }
  }
  if (resolvedRoots.length === 0) {
    core.warning(
      `Could not resolve any allowed root(s); no files will be considered for hashing.`
    )
    return ''
  }

  const outsideRootFiles: string[] = []
  const result = crypto.createHash('sha256')
  const pipeline = util.promisify(stream.pipeline)
  let hasMatch = false
  let count = 0

  for await (const file of globber.globGenerator()) {
    writeDelegate(file)

    // Resolve real path of the file for symlink-safe exclude + root checking
    let resolvedFile: string
    try {
      resolvedFile = fs.realpathSync(file)
    } catch (err) {
      core.warning(
        `Could not read "${file}". Please check symlinks and file access. Details: ${err}`
      )
      continue
    }

    // Exclude matching patterns (apply to resolved path for symlink-safety)
    if (isExcluded(resolvedFile, excludeMatchers, githubWorkspace)) {
      writeDelegate(`Exclude '${file}' (exclude pattern match).`)
      continue
    }

    // Check if in resolved roots
    if (!isInResolvedRoots(resolvedFile, resolvedRoots)) {
      outsideRootFiles.push(file)
      if (allowOutside) {
        writeDelegate(
          `Including '${file}' since it is outside the allowed root(s) and 'allowFilesOutsideWorkspace' is enabled.`
        )
      } else {
        writeDelegate(`Skip '${file}' since it is not under allowed root(s).`)
        continue
      }
    }

    if (fs.statSync(resolvedFile).isDirectory()) {
      writeDelegate(`Skip directory '${file}'.`)
      continue
    }

    const hash = crypto.createHash('sha256')
    await pipeline(fs.createReadStream(resolvedFile), hash)
    result.write(hash.digest())
    count++
    hasMatch = true
  }
  result.end()

  // Warn if any files outside root were found without opt-in.
  if (!allowOutside && outsideRootFiles.length > 0) {
    const shown = outsideRootFiles.slice(0, MAX_WARNED_FILES)
    const remaining = outsideRootFiles.length - shown.length
    const fileList = shown.map(f => `- ${f}`).join('\n')
    const suffix =
      remaining > 0
        ? `\n  ...and ${remaining} more file(s). Enable debug logging to see all.`
        : ''
    core.warning(
      `Some matched files are outside the allowed root(s) and were skipped:\n${fileList}${suffix}\n` +
        `To include them, set 'allowFilesOutsideWorkspace: true' in your options.`
    )
  }

  if (hasMatch) {
    writeDelegate(`Found ${count} files to hash.`)
    return result.digest('hex')
  } else {
    writeDelegate(`No matches found for glob`)
    return ''
  }
}
