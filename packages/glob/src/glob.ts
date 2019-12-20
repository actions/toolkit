import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import * as patternHelper from './internal-pattern-helper'
import {IGlobOptions} from './internal-glob-options'
import {MatchResult} from './internal-match-result'
import {Pattern} from './internal-pattern'
import {SearchState} from './internal-search-state'

export {IGlobOptions}

/**
 * Returns files and directories matching the specified glob pattern.
 *
 * Order of the results is not guaranteed.
 */
export async function glob(
  pattern: string,
  options?: IGlobOptions
): Promise<string[]> {
  // Set defaults options
  options = getOptions(options)

  // Parse patterns
  const patterns: Pattern[] = patternHelper.parse([pattern], options)

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
        // Matched
        if (matchResult & MatchResult.Directory) {
          result.push(item.path)
        }
        // Descend?
        else if (!patternHelper.partialMatch(patterns, item.path)) {
          continue
        }

        // Push the child items in reverse
        const childLevel = item.level + 1
        const childItems = (await fs.promises.readdir(item.path)).map(
          x => new SearchState(path.join(item.path, x), childLevel)
        )
        stack.push(...childItems.reverse())
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
  const patterns: Pattern[] = patternHelper.parse([pattern], getOptions())
  const searchPaths: string[] = patternHelper.getSearchPaths(patterns)
  return searchPaths.length > 0 ? searchPaths[0] : ''
}

async function stat(
  item: SearchState,
  options: IGlobOptions,
  traversalChain: string[]
): Promise<fs.Stats | undefined> {
  // Note:
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

function getOptions(copy?: IGlobOptions): IGlobOptions {
  const result: IGlobOptions = {
    followSymbolicLinks: true,
    implicitDescendants: true,
    omitBrokenSymbolicLinks: true
  }

  if (copy) {
    if (typeof copy.followSymbolicLinks === 'boolean') {
      result.followSymbolicLinks = copy.followSymbolicLinks
      core.debug(`followSymbolicLinks '${result.followSymbolicLinks}'`)
    }

    if (typeof copy.implicitDescendants === 'boolean') {
      result.implicitDescendants = copy.implicitDescendants
      core.debug(`implicitDescendants '${result.implicitDescendants}'`)
    }

    if (typeof copy.omitBrokenSymbolicLinks === 'boolean') {
      result.omitBrokenSymbolicLinks = copy.omitBrokenSymbolicLinks
      core.debug(`omitBrokenSymbolicLinks '${result.omitBrokenSymbolicLinks}'`)
    }
  }

  return result
}
