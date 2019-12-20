import * as assert from 'assert'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Helper class for parsing paths into segments. The first separator is always
 * the root. On Windows, any slashes in the root segment are converted to `/`.
 */
export class Path {
  segments: string[] = []

  constructor(rootedPath: string) {
    assert(rootedPath, `Parameter 'rootedPath' cannot be empty`)
    assert(
      pathHelper.isRooted(rootedPath),
      `Parameter 'rootedPath' must be rooted. Invalid path: '${rootedPath}'`
    )

    // Normalize slashes
    // Trim trailing slash
    rootedPath = pathHelper.normalizeSeparators(rootedPath)
    rootedPath = pathHelper.safeTrimTrailingSeparator(rootedPath)

    // Add all segments, while not at the root
    let remaining = rootedPath
    let dir = pathHelper.dirname(remaining)
    while (dir !== remaining) {
      // Add the segment
      const basename = path.basename(remaining)
      assert(basename !== '.', `Unexpected segment '.' in path '${rootedPath}'`)
      assert(
        basename !== '..',
        `Unexpected segment '..' in path '${rootedPath}'`
      )
      this.segments.unshift(basename)

      // Truncate the last segment
      remaining = dir
      dir = pathHelper.dirname(remaining)
    }

    // Remainder is the root
    // On Windows, convert any slashes in the root to '/'
    this.segments.unshift(
      IS_WINDOWS ? remaining.replace(/\\/g, '/') : remaining
    )
  }
}
