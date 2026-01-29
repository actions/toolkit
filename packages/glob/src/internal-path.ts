import * as path from 'path'
import * as pathHelper from './internal-path-helper.js'
import assert from 'assert'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Helper class for parsing paths into segments
 */
export class Path {
  segments: string[] = []

  /**
   * Constructs a Path
   * @param itemPath Path or array of segments
   */
  constructor(itemPath: string | string[]) {
    // String
    if (typeof itemPath === 'string') {
      assert(itemPath, `Parameter 'itemPath' must not be empty`)

      // Normalize slashes and trim unnecessary trailing slash
      itemPath = pathHelper.safeTrimTrailingSeparator(itemPath)

      // Not rooted
      if (!pathHelper.hasRoot(itemPath)) {
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
        this.segments.unshift(remaining)
      }
    }
    // Array
    else {
      // Must not be empty
      assert(
        itemPath.length > 0,
        `Parameter 'itemPath' must not be an empty array`
      )

      // Each segment
      for (let i = 0; i < itemPath.length; i++) {
        let segment = itemPath[i]

        // Must not be empty
        assert(
          segment,
          `Parameter 'itemPath' must not contain any empty segments`
        )

        // Normalize slashes
        segment = pathHelper.normalizeSeparators(itemPath[i])

        // Root segment
        if (i === 0 && pathHelper.hasRoot(segment)) {
          segment = pathHelper.safeTrimTrailingSeparator(segment)
          assert(
            segment === pathHelper.dirname(segment),
            `Parameter 'itemPath' root segment contains information for multiple segments`
          )
          this.segments.push(segment)
        }
        // All other segments
        else {
          // Must not contain slash
          assert(
            !segment.includes(path.sep),
            `Parameter 'itemPath' contains unexpected path separators`
          )
          this.segments.push(segment)
        }
      }
    }
  }

  /**
   * Converts the path to it's string representation
   */
  toString(): string {
    // First segment
    let result = this.segments[0]

    // All others
    let skipSlash =
      result.endsWith(path.sep) || (IS_WINDOWS && /^[A-Z]:$/i.test(result))
    for (let i = 1; i < this.segments.length; i++) {
      if (skipSlash) {
        skipSlash = false
      } else {
        result += path.sep
      }

      result += this.segments[i]
    }

    return result
  }
}
