import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import * as patternHelper from './internal-pattern-helper'
import {IGlobOptions} from './internal-glob-options'
import {MatchKind} from './internal-match-kind'
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
  const result: string[] = []
  for await (const itemPath of globGenerator(pattern, options)) {
    result.push(itemPath)
  }
  return result
}

/**
 * Returns files and directories matching the specified glob pattern.
 *
 * Order of the results is not guaranteed.
 */
export async function* globGenerator(
  pattern: string,
  options?: IGlobOptions
): AsyncGenerator<string, void> {
  // Set defaults options
  options = patternHelper.getOptions(options)

  // Parse patterns
  const patterns: Pattern[] = patternHelper.parse([pattern], options)

  // Push the search paths
  const stack: SearchState[] = []
  for (const searchPath of patternHelper.getSearchPaths(patterns)) {
    core.debug(`Search path '${searchPath}'`)

    // Exists?
    try {
      // Intentionally using lstat. Detection for broken symlink
      // will be performed later (if following symlinks).
      await fs.promises.lstat(searchPath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        continue
      }
      throw err
    }

    stack.unshift(new SearchState(searchPath, 1))
  }

  // Search
  const traversalChain: string[] = [] // used to detect cycles
  while (stack.length) {
    // Pop
    const item = stack.pop() as SearchState

    // Match?
    const match = patternHelper.match(patterns, item.path)
    const partialMatch =
      !!match || patternHelper.partialMatch(patterns, item.path)
    if (!match && !partialMatch) {
      continue
    }

    // Stat
    const stats: fs.Stats | undefined = await stat(
      item,
      options,
      traversalChain
    )

    // Broken symlink, or symlink cycle detected, or no longer exists
    if (!stats) {
      continue
    }

    // Directory
    if (stats.isDirectory()) {
      // Matched
      if (match & MatchKind.Directory) {
        yield item.path
      }
      // Descend?
      else if (!partialMatch) {
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
    else if (match & MatchKind.File) {
      yield item.path
    }
  }
}

/**
 * Returns the search path preceeding the first segment that contains a pattern.
 *
 * For example, '/foo/bar*' returns '/foo'.
 */
export function getSearchPath(pattern: string): string {
  const patterns: Pattern[] = patternHelper.parse(
    [pattern],
    patternHelper.getOptions()
  )
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
