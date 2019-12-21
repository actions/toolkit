import * as assert from 'assert'
import * as path from 'path'
import * as pathHelper from './internal-path-helper'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Helper class for parsing paths into segments. On Windows, any slashes
 * in the root segment are converted to `/`.
 */
export class Path {
  segments: string[] = []

  constructor(itemPath: string) {
    assert(itemPath, `Parameter 'itemPath' cannot be empty`)

    // Normalize slashes
    // Trim trailing slash
    itemPath = pathHelper.normalizeSeparators(itemPath)
    itemPath = pathHelper.safeTrimTrailingSeparator(itemPath)

    // Not rooted
    if (!pathHelper.isRooted(itemPath)) {
      this.segments = itemPath.split(path.sep)
    }
    // Rooted
    else {
      // Add all segments, while not at the root
      let remaining = itemPath
      let dir = pathHelper.dirname(remaining)
      while (dir !== remaining) {
        // Add the segment
        const basename = path.basename(remaining)
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
}
