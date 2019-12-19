import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import * as patternHelper from './internal-pattern-helper'
import {MatchResult, Pattern} from './internal-pattern'
import {SearchState} from './internal-search-state'

/**
 * Properties to control glob behavior
 */
export class GlobOptions {
  /**
   * Indicates whether to follow symbolic links. Generally should be true
   * unless deleting files.
   *
   * Default is true.
   */
  followSymbolicLinks: boolean = true

  /**
   * Indicates whether directories that match a glob pattern, should implicitly
   * cause all descendant paths to be matched.
   *
   * For example, given the directory 'my-dir', the following glob patterns
   * would produce the same results: 'my-dir/**', 'my-dir/', 'my-dir'
   *
   * Default is true.
   */
  implicitDescendants: boolean = true

  /**
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * Default is true.
   */
  omitBrokenSymbolicLinks: boolean = true
}

/**
 * Returns files and directories matching the specified glob pattern.
 */
export async function glob(
  pattern: string,
  options?: GlobOptions
): Promise<string[]> {
  // Default options
  options = options || new GlobOptions()
  core.debug(`options.followSymbolicLinks '${options.followSymbolicLinks}'`)
  core.debug(`options.implicitDescendants '${options.implicitDescendants}'`)
  core.debug(
    `options.omitBrokenSymbolicLinks '${options.omitBrokenSymbolicLinks}'`
  )

  // Parse patterns
  const patterns: Pattern[] = patternHelper.parse(
    [pattern],
    options.implicitDescendants
  )

  // Get search paths
  const searchPaths: string[] = patternHelper.getSearchPaths(patterns)

  // Search
  const result: string[] = []
  for (const searchPath of searchPaths) {
    // Skip if not exists
    try {
      await fs.promises.lstat(searchPath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        continue
      }
      throw err
    }

    // Push the first item
    const stack: SearchState[] = [new SearchState(searchPath, 1)]
    const traversalChain: string[] = [] // used to detect cycles

    while (stack.length) {
      // Pop
      const item = stack.pop() as SearchState
      const stats: fs.Stats | undefined = await stat(
        item,
        options,
        traversalChain
      )

      // Broken symlink or symlink cycle detected
      if (!stats) {
        continue
      }

      // Match
      const matchResult = patternHelper.match(patterns, item.path)

      // Directory
      if (stats.isDirectory()) {
        if (matchResult & MatchResult.Directory) {
          result.push(item.path)
        }

        // Descend?
        if (
          matchResult & MatchResult.Directory ||
          patternHelper.partialMatch(patterns, item.path)
        ) {
          // Push the child items in reverse
          const childLevel = item.level + 1
          const childItems = (await fs.promises.readdir(item.path)).map(
            x => new SearchState(path.join(item.path, x), childLevel)
          )
          stack.push(...childItems.reverse())
        }
      }
      // File
      else if (matchResult & MatchResult.File) {
        result.push(item.path)
      }
    }
  }

  return result
}

/**
 * Returns the search path preceeding the first segment that contains a pattern.
 *
 * For example, '/foo/bar*' returns '/foo'.
 */
export function getSearchPath(pattern: string): string {
  const patterns: Pattern[] = patternHelper.parse([pattern], false)
  const searchPaths: string[] = patternHelper.getSearchPaths(patterns)
  return searchPaths.length > 0 ? searchPaths[0] : ''
}

async function stat(
  item: SearchState,
  options: GlobOptions,
  traversalChain: string[]
): Promise<fs.Stats | undefined> {
  // Stat the item. The stat info is used further below to determine whether to traverse deeper
  //
  // `stat` returns info about the target of a symlink (or symlink chain)
  // `lstat` returns info about a symlink itself
  let stats: fs.Stats
  if (options.followSymbolicLinks) {
    try {
      // Use `stat` (following symlinks)
      stats = await fs.promises.stat(item.path)
    } catch (err) {
      if (err.code === 'ENOENT') {
        if (options.omitBrokenSymbolicLinks) {
          core.debug(`Broken symlink '${item.path}'`)
          return undefined
        }

        throw new Error(
          `No information found for the path '${
            item.path
          }'. This may indicate a broken symbolic link.`
        )
      }

      throw err
    }
  } else {
    // Use `lstat` (not following symlinks)
    stats = await fs.promises.lstat(item.path)
  }

  // Note, isDirectory() returns false for the lstat of a symlink
  if (stats.isDirectory() && options.followSymbolicLinks) {
    // Get the realpath
    const realPath: string = await fs.promises.realpath(item.path)

    // Fixup the traversal chain to match the item level
    while (traversalChain.length >= item.level) {
      traversalChain.pop()
    }

    // Test for a cycle
    if (traversalChain.some((x: string) => x === realPath)) {
      core.debug(
        `Symlink cycle detected for path '${
          item.path
        }' and realpath '${realPath}'`
      )
      return undefined
    }

    // Update the traversal chain
    traversalChain.push(realPath)
  }

  return stats
}
