# `@actions/io`

> Core functions for cli filesystem scenarios

## Usage

```
/**
 * Copies a file or folder.
 * 
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
export function cp(source: string, dest: string, options?: CopyOptions): Promise<void>

/**
 * Remove a path recursively with force
 * 
 * @param     path     path to remove
 */
export function rmRF(path: string): Promise<void>

/**
 * Make a directory.  Creates the full path with folders in between
 * 
 * @param     p       path to create
 * @returns   Promise<void>
 */
export function mkdirP(p: string): Promise<void>

/**
 * Moves a path.
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
export function mv(source: string, dest: string, options?: CopyOptions): Promise<void>

/**
 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
 * 
 * @param     tool              name of the tool
 * @param     options           optional. See WhichOptions.
 * @returns   Promise<string>   path to tool
 */
export function which(tool: string, options?: WhichOptions): Promise<string>
```