import * as core from '@actions/core'
import * as fs from 'fs'
import * as globOptionsHelper from './internal-glob-options-helper'
import * as path from 'path'
import * as patternHelper from './internal-pattern-helper'
import {GlobOptions} from './internal-glob-options'
import {MatchKind} from './internal-match-kind'
import {Pattern} from './internal-pattern'
import {SearchState} from './internal-search-state'

const IS_WINDOWS = process.platform === 'win32'

export {GlobOptions}

/**
 * Used to match files and directories
 */
export interface Globber {
  /**
   * Returns the search path preceding the first glob segment, from each pattern.
   * Duplicates and descendants of other paths are filtered out.
   *
   * Example 1: The patterns `/foo/*` and `/bar/*` returns `/foo` and `/bar`.
   *
   * Example 2: The patterns `/foo/*` and `/foo/bar/*` returns `/foo`.
   */
  getSearchPaths(): string[]

  /**
   * Returns files and directories matching the glob patterns.
   *
   * Order of the results is not guaranteed.
   */
  glob(): Promise<string[]>

  /**
   * Returns files and directories matching the glob patterns.
   *
   * Order of the results is not guaranteed.
   */
  globGenerator(): AsyncGenerator<string, void>
}

export class DefaultGlobber implements Globber {
  private readonly options: GlobOptions
  private readonly patterns: Pattern[] = []
  private readonly searchPaths: string[] = []

  private constructor(options?: GlobOptions) {
    this.options = globOptionsHelper.getOptions(options)
  }

  getSearchPaths(): string[] {
    // Return a copy
    return this.searchPaths.slice()
  }

  async glob(): Promise<string[]> {
    const result: string[] = []
    for await (const itemPath of this.globGenerator()) {
      result.push(itemPath)
    }
    return result
  }

  async *globGenerator(): AsyncGenerator<string, void> {
    // Fill in defaults options
    const options = globOptionsHelper.getOptions(this.options)
    // Implicit descendants?
    const patterns: Pattern[] = []
    for (const pattern of this.patterns) {
      patterns.push(pattern)
      if (
        options.implicitDescendants &&
        (pattern.trailingSeparator ||
          pattern.segments[pattern.segments.length - 1] !== '**')
      ) {
        patterns.push(
          new Pattern(pattern.negate, true, pattern.segments.concat('**'))
        )
      }
    }

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
      const stats: fs.Stats | undefined = await DefaultGlobber.stat(
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
        if (match & MatchKind.Directory && options.matchDirectories) {
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
   * Constructs a DefaultGlobber
   */
  static async create(
    patterns: string,
    options?: GlobOptions
  ): Promise<DefaultGlobber> {
    const result = new DefaultGlobber(options)

    if (IS_WINDOWS) {
      patterns = patterns.replace(/\r\n/g, '\n')
      patterns = patterns.replace(/\r/g, '\n')
    }

    const lines = patterns.split('\n').map(x => x.trim())
    for (const line of lines) {
      // Empty or comment
      if (!line || line.startsWith('#')) {
        continue
      }
      // Pattern
      else {
        result.patterns.push(new Pattern(line))
      }
    }

    result.searchPaths.push(...patternHelper.getSearchPaths(result.patterns))

    return result
  }

  private static async stat(
    item: SearchState,
    options: GlobOptions,
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
            `No information found for the path '${item.path}'. This may indicate a broken symbolic link.`
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
          `Symlink cycle detected for path '${item.path}' and realpath '${realPath}'`
        )
        return undefined
      }

      // Update the traversal chain
      traversalChain.push(realPath)
    }

    return stats
  }
}
