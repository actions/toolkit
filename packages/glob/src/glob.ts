import * as core from '@actions/core'
import * as fs from 'fs'
import * as patternHelper from './internal-pattern-helper'
import {MatchResult, Pattern} from './internal-pattern-helper'
import {Stats} from 'fs'

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

  // Parse glob patterns
  const patterns: Pattern[] = patternHelper.parsePatterns([pattern])

  // Get search paths
  const searchPaths: string[] = patternHelper.getSearchPaths(patterns)

  // Search
  const result: string[] = []
  for (const searchPath of searchPaths) {
    // Skip if not exists
    if (!await searchPathExists(searchPath)) {
      continue
    }

    // Push the first item
    let stack: SearchState[] = [new SearchState(searchPath, 1)]
    let traversalChain: string[] = [] // used to detect cycles

    while (stack.length) {
      // Pop
      const item = stack.pop() as SearchState

      // Match
      const matchResult = patternHelper.match(patterns, item.path)
      if (matchResult) {

        const stats: Stats | undefined = await stat(item, options, traversalChain)
        if (!stats) {
          continue
        }

        
        // if (matchResult == MatchResult.Directory)
        // result.push(item.path)


//               // push the child items in reverse onto the stack
//               let childLevel: number = item.level + 1;
//               let childItems: _FindItem[] =
//                   fs.readdirSync(item.path)
//                       .map((childName: string) => new _FindItem(path.join(item.path, childName), childLevel));
//               for (var i = childItems.length - 1; i >= 0; i--) {
//                   stack.push(childItems[i]);
//               }
      }
    }

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





  }

  return result
}

/**
 * Returns the search path preceeding the first segment that contains a pattern.
 *
 * For example, '/foo/bar*' returns '/foo'.
 */
export function getSearchPath(pattern: string): string {
  const patterns: Pattern[] = patternHelper.parsePatterns([pattern])
  const searchPaths: string[] = patternHelper.getSearchPaths(patterns)
  return searchPaths.length > 0 ? searchPaths[0] : ''
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

async function searchPathExists(searchPath: string): Promise<boolean> {
  try {
    await fs.promises.lstat(searchPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    throw err
  }

  return true
}

async function stat(item: SearchState, options: GlobOptions, traversalChain: string[]): Promise<Stats | undefined> {
  // Stat the item. The stat info is used further below to determine whether to traverse deeper
  //
  // `stat` returns info about the target of a symlink (or symlink chain)
  // `lstat` returns info about a symlink itself
  let stats: Stats;
  if (options.followSymbolicLinks) {
    try {
      // Use `stat` (following symlinks)
      stats = await fs.promises.stat(item.path);
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        if (options.omitBrokenSymbolicLinks) {
          core.debug(`Broken symlink '${item.path}'`)
          return undefined
        }

        throw new Error(`No information found for the path '${item.path}'. This may indicate a broken symbolic link.`)
      }

      throw err
    }
  }
  else {
    // Use `lstat` (not following symlinks)
    stats = await fs.promises.lstat(item.path)
  }

  // Note, isDirectory() returns false for the lstat of a symlink
  if (stats.isDirectory() && options.followSymbolicLinks) {
      // Get the realpath
      const realPath: string = await fs.promises.realpath(item.path);

      // Fixup the traversal chain to match the item level
      while (traversalChain.length >= item.level) {
        traversalChain.pop();
      }

      // Test for a cycle
      if (traversalChain.some((x: string) => x == realPath)) {
        core.debug(`Symlink cycle detected for path '${item.path}' and realpath '${realPath}'`);
        return undefined
      }

      // Update the traversal chain
      traversalChain.push(realPath);
  }

  return stats
}

class SearchState {
  path: string
  level: number

  constructor(path: string, level: number) {
    this.path = path
    this.level = level
  }
}

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
