import * as core from '@actions/core'
import * as fs from 'fs'
import * as pathHelpers from './internal-path-helpers'
import {Pattern} from './internal-pattern-helpers'

const IS_WINDOWS = process.platform === 'win32'

/**
 * Properties to control glob behavior
 */
export class GlobOptions {
  /**
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * Default is true.
   */
  omitBrokenSymbolicLinks: boolean = true

  /**
   * Indicates whether to follow symbolic links. Generally should be true
   * unless deleting files.
   *
   * Default is true.
   */
  followSymbolicLinks: boolean = true

  /**
   * Indicates whether directories that match the glob pattern, should cause
   * all descendant paths to be included in the result set also.
   *
   * For example, given the directory 'my-dir', the following glob patterns
   * would produce the same results: 'my-dir/**', 'my-dir/', 'my-dir'
   *
   * Default is true.
   */
  expandDirectories: boolean = true
}

/**
 * Returns files and directories matching the specified glob pattern.
 */
export async function glob(
  pattern: string,
  options?: GlobOptions
): Promise<string[]> {
  options = options || new GlobOptions()
  core.debug(`options.expandDirectories '${options.expandDirectories}'`)
  core.debug(`options.followSymbolicLinks '${options.followSymbolicLinks}'`)
  core.debug(
    `options.omitBrokenSymbolicLinks '${options.omitBrokenSymbolicLinks}'`
  )

  // Create patterns
  const patterns: Pattern[] = createPatterns([pattern])

  // Get search paths
  const searchPaths: string[] = getSearchPaths(patterns)

  // Search
  const result: string[] = []
  for (const searchPath of searchPaths) {
    core.debug(`search path '${searchPath}'`)

    // Skip if not exists
    try {
      fs.lstatSync(searchPath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        continue
      }

      throw err
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
  const patterns: Pattern[] = createPatterns([pattern])
  const searchPaths: string[] = getSearchPaths(patterns)
  return searchPaths.length > 0 ? searchPaths[0] : ''
}

function createPatterns(globs: string[]): Pattern[] {
  const result: Pattern[] = []

  for (const globItem of globs) {
    const pattern = new Pattern(globItem)
    if (!pattern.comment) {
      result.push(pattern)
    }
  }

  return result
}

function getSearchPaths(patterns: Pattern[]): string[] {
  // Ignore comment and negate patterns
  patterns = patterns.filter(x => !x.comment && !x.negate)

  // Create a map of all search paths
  const searchPathMap: {[key: string]: string} = {}
  for (const pattern of patterns) {
    const key = IS_WINDOWS
      ? pattern.searchPath.toUpperCase()
      : pattern.searchPath
    searchPathMap[key] = 'candidate'
  }

  // Build an array of search paths
  const searchPaths: string[] = []
  for (const pattern of patterns.filter(x => !x.comment && !x.negate)) {
    // Check if already included
    const key = IS_WINDOWS
      ? pattern.searchPath.toUpperCase()
      : pattern.searchPath
    if (searchPathMap[key] === 'included') {
      continue
    }

    // Check for an ancestor search path
    let foundAncestor = false
    let tempKey = key
    let parent = pathHelpers.dirname(tempKey)
    while (parent !== tempKey) {
      if (searchPathMap[parent]) {
        foundAncestor = true
        break
      }

      tempKey = parent
      parent = pathHelpers.dirname(tempKey)
    }

    if (!foundAncestor) {
      searchPaths.push(pattern.searchPath)
      searchPathMap[key] = 'included'
    }
  }

  return searchPaths
}

// class SearchState {
//   path: string
//   patterns:
//   // level: number
//   // inGlobstar: boolean

//   public constructor(path: string, level: number, inGlobstar: boolean) {
//     this.path = path
//     this.level = level
//     this.inGlobstar = inGlobstar
//   }
// }

// class _FindItem {
//   public path: string;
//   public level: number;

//   public constructor(path: string, level: number) {
//       this.path = path;
//       this.level = level;
//   }
// }

// /**
//  * Recursively finds all paths a given path. Returns an array of paths.
//  *
//  * @param     findPath  path to search
//  * @param     options   optional. defaults to { followSymbolicLinks: true }. following soft links is generally appropriate unless deleting files.
//  * @returns   string[]
//  */
// export function find(findPath: string, options?: FindOptions): string[] {
//   if (!findPath) {
//       debug('no path specified');
//       return [];
//   }

//   // normalize the path, otherwise the first result is inconsistently formatted from the rest of the results
//   // because path.join() performs normalization.
//   findPath = path.normalize(findPath);

//   // debug trace the parameters
//   debug(`findPath: '${findPath}'`);
//   options = options || _getDefaultFindOptions();
//   _debugFindOptions(options)

//   // return empty if not exists
//   try {
//       fs.lstatSync(findPath);
//   }
//   catch (err) {
//       if (err.code == 'ENOENT') {
//           debug('0 results')
//           return [];
//       }

//       throw err;
//   }

//   try {
//       let result: string[] = [];

//       // push the first item
//       let stack: _FindItem[] = [new _FindItem(findPath, 1)];
//       let traversalChain: string[] = []; // used to detect cycles

//       while (stack.length) {
//           // pop the next item and push to the result array
//           let item = stack.pop()!; // non-null because `stack.length` was truthy
//           result.push(item.path);

//           // stat the item.  the stat info is used further below to determine whether to traverse deeper
//           //
//           // stat returns info about the target of a symlink (or symlink chain),
//           // lstat returns info about a symlink itself
//           let stats: fs.Stats;
//           if (options.followSymbolicLinks) {
//               try {
//                   // use stat (following all symlinks)
//                   stats = fs.statSync(item.path);
//               }
//               catch (err) {
//                   if (err.code == 'ENOENT' && options.allowBrokenSymbolicLinks) {
//                       // fallback to lstat (broken symlinks allowed)
//                       stats = fs.lstatSync(item.path);
//                       debug(`  ${item.path} (broken symlink)`);
//                   }
//                   else {
//                       throw err;
//                   }
//               }
//           }
//           else if (options.followSpecifiedSymbolicLink && result.length == 1) {
//               try {
//                   // use stat (following symlinks for the specified path and this is the specified path)
//                   stats = fs.statSync(item.path);
//               }
//               catch (err) {
//                   if (err.code == 'ENOENT' && options.allowBrokenSymbolicLinks) {
//                       // fallback to lstat (broken symlinks allowed)
//                       stats = fs.lstatSync(item.path);
//                       debug(`  ${item.path} (broken symlink)`);
//                   }
//                   else {
//                       throw err;
//                   }
//               }
//           }
//           else {
//               // use lstat (not following symlinks)
//               stats = fs.lstatSync(item.path);
//           }

//           // note, isDirectory() returns false for the lstat of a symlink
//           if (stats.isDirectory()) {
//               debug(`  ${item.path} (directory)`);

//               if (options.followSymbolicLinks) {
//                   // get the realpath
//                   let realPath: string = fs.realpathSync(item.path);

//                   // fixup the traversal chain to match the item level
//                   while (traversalChain.length >= item.level) {
//                       traversalChain.pop();
//                   }

//                   // test for a cycle
//                   if (traversalChain.some((x: string) => x == realPath)) {
//                       debug('    cycle detected');
//                       continue;
//                   }

//                   // update the traversal chain
//                   traversalChain.push(realPath);
//               }

//               // push the child items in reverse onto the stack
//               let childLevel: number = item.level + 1;
//               let childItems: _FindItem[] =
//                   fs.readdirSync(item.path)
//                       .map((childName: string) => new _FindItem(path.join(item.path, childName), childLevel));
//               for (var i = childItems.length - 1; i >= 0; i--) {
//                   stack.push(childItems[i]);
//               }
//           }
//           else {
//               debug(`  ${item.path} (file)`);
//           }
//       }

//       debug(`${result.length} results`);
//       return result;
//   }
//   catch (err) {
//       throw new Error(loc('LIB_OperationFailed', 'find', err.message));
//   }
// }

// class _FindItem {
//   public path: string;
//   public level: number;

//   public constructor(path: string, level: number) {
//       this.path = path;
//       this.level = level;
//   }
// }

// function _debugFindOptions(options: FindOptions): void {
//   debug(`findOptions.allowBrokenSymbolicLinks: '${options.allowBrokenSymbolicLinks}'`);
//   debug(`findOptions.followSpecifiedSymbolicLink: '${options.followSpecifiedSymbolicLink}'`);
//   debug(`findOptions.followSymbolicLinks: '${options.followSymbolicLinks}'`);
// }
