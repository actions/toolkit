# Package Specs

In order to support the node-config action, I propose adding the following into 4 libraries (`tool-cache`, `core`, `io`, `exec`), with `tool-cache` having dependencies on the other 3 libs:

## `core` spec

Holds all the functions necessary for interacting with the runner/environment.

```ts
// Logging functions
export function debug(message: string): void
export function warning(message: string): void
export function error(message: string): void

/**
 * Sets env variable for this action and future actions in the job
 *
 * @param name The name of the variable to set
 * @param val The value of the variable
 */
export function exportVariable(name: string, val: string): void

/**
 * Exports the variable and registers a secret which will get masked from logs
 *
 * @param name The name of the variable to set
 * @param val Value of the secret
 */
export function exportSecret(name: string, val: string): void

/**
 * Prepends inputPath to the PATH
 *
 * @param inputPath
 */
export function addPath(inputPath: string): void

/**
 * Interface for getInput options
 */
export interface InputOptions {
  /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
  required?: bool
}

/**
 * Gets the value of an input. The value is also trimmed.
 *
 * @param name Name of the input to get
 * @param options  Optional, see InputOptions
 * @returns string
 */
export function getInput(
  name: string,
  options?: InputOptions
): string | undefined

/**
 * Sets the status of the action to neutral
 *
 * @param message
 */
export function setNeutral(message: string): void

/**
 * Sets the status of the action to failed
 *
 * @param message
 */
export function setFailed(message: string): void
```

## `io` spec

Holds all the functions necessary for filesystem manipulation (CLI scenarios, not `fs` replacements):

```ts
/**
 * Interface for cp/mv options
 */
export interface CopyOptions {
  /** Optional. Whether to recursively copy all subdirectories. Defaults to false */
  recursive?: boolean
  /** Optional. Whether to overwrite existing files in the destination. Defaults to true */
  force?: boolean
}

/**
 * Copies a file or folder.
 *
 * @param source Source path
 * @param dest Destination path
 * @param options Optional, see CopyOptions
 */
export function cp(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<void>

/**
 * Remove a path recursively with force
 *
 * @param path Path to remove
 */
export function rmRF(path: string): Promise<void>

/**
 * Make a directory. Creates the full path with folders in between
 *
 * @param p Path to create
 * @returns Promise<void>
 */
export function mkdirP(p: string): Promise<void>

/**
 * Moves a path.
 *
 * @param source Source path
 * @param dest Destination path
 * @param options Optional, see CopyOptions
 */
export function mv(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<void>

/**
 * Interface for which options
 */
export interface WhichOptions {
  /** Optional. Whether to check if tool exists. If true, will throw if it fails. Defaults to false */
  check?: boolean
}

/**
 * Returns path of a tool had the tool actually been invoked. Resolves via paths.
 *
 * @param tool Name of the tool
 * @param options Optional, see WhichOptions
 * @returns Promise<string> Path to tool
 */
export function which(tool: string, options?: WhichOptions): Promise<string>
```

## `exec` spec

Holds all the functions necessary for running the tools node-config depends on (aka: `7-zip` and `tar`)

```ts
/**
 * Interface for exec options
 */
export interface IExecOptions

/**
 * Exec a command.
 *
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param commandLine Command to execute
 * @param args Optional additional arguments
 * @param options Optional exec options, see IExecOptions
 * @returns Promise<number> Return code
 */
export function exec(commandLine: string, args?: string[], options?: IExecOptions): Promise<number>
```

## `tool-cache` spec

Holds all the functions necessary for downloading and caching node.

```ts
/**
 * Download a tool from an url and stream it into a file
 *
 * @param url Url of tool to download
 * @returns Path to downloaded tool
 */
export async function downloadTool(url: string): Promise<string>

/**
 * Extract a .7z file
 *
 * @param file Path to the .7z file
 * @param dest Optional destination directory
 * @returns Path to the destination directory
 */
export async function extract7z(file: string, dest?: string): Promise<string>

/**
 * Extract a tar
 *
 * @param file Path to the tar
 * @param dest Optional destination directory
 * @returns Path to the destination directory
 */
export async function extractTar(
  file: string,
  destination?: string
): Promise<string>

/**
 * Caches a directory and installs it into the tool cacheDir
 *
 * @param sourceDir The directory to cache into tools
 * @param tool Tool name
 * @param version Version of the tool (semver format)
 * @param arch Optional architecture of the tool. Defaults to machine architecture
 */
export async function cacheDir(
  sourceDir: string,
  tool: string,
  version: string,
  arch?: string
): Promise<string>

/**
 * Finds the path to a tool in the local installed tool cache
 *
 * @param toolName Name of the tool
 * @param versionSpec Version of the tool
 * @param arch Optional arch.  defaults to arch of computer
 */
export function find(
  toolName: string,
  versionSpec: string,
  arch?: string
): string
```
