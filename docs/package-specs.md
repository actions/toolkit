# Package Specs

In order to support the node-config action, I propose adding the following into 4 libraries (tool-cache, core, io, exec), with tool-cache having dependencies on the other 3 libs:

### Core spec

Holds all the functions necessary for interacting with the runner/environment.

```
// Logging functions
export function debug(message: string): void
export function warning(message: string): void
export function error(message: string): void

/**
 * sets env variable for this action and future actions in the job
 *
 * @param name      the name of the variable to set
 * @param val       the value of the variable
 * @param isSecret  whether the variable should be marked as secret (will be masked from logs)
 */
export function exportVariable(name: string, val: string, isSecret: bool = false): void

/**
 * Gets the value of an input.  The value is also trimmed.
 * If required is true and the value is not set, it will throw.
 * 
 * @param     name     name of the input to get
 * @param     required whether input is required.  optional, defaults to false
 * @returns   string
 */
export function getInput(name: string, required?: boolean): string | undefined

/**
 * fail the action
 * @param message 
 */
export function fail(message: string): void
```

### IO spec

Holds all the functions necessary for file system manipulation (cli scenarios, not fs replacements):

```
/**
 * Copies a file or folder.
 * 
 * @param     source            source path
 * @param     dest              destination path
 * @param     recursive         whether to recursively copy all subdirectories
 * @param     force             whether to overwrite existing files in the destination
 */
export function cp(source: string, dest: string, recursive: boolean = false, force: boolean = true): Promise<void>

/**
 * Remove a path recursively with force
 * 
 * @param     path     path to remove
 */
export function rmRF(path: string): Promise<void>

/**
 * Make a directory.  Creates the full path with folders in between
 * Will throw if it fails
 * 
 * @param     p       path to create
 * @returns   Promise<void>
 */
export function mkdirP(p: string): Promise<void>

/**
 * Moves a path.
 * 
 * @param     source     source path
 * @param     dest       destination path
 * @param     recursive  whether to recursively copy all subdirectories
 * @param     force      whether to overwrite existing files in the destination
 */
export function mv(source: string, dest: string, recursive: boolean = false, force: boolean = true): Promise<void>

/**
 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
 * If you check and the tool does not exist, it will throw.
 * 
 * @param     tool              name of the tool
 * @param     check             whether to check if tool exists
 * @returns   Promise<string>   path to tool
 */
export function which(tool: string, check?: boolean): Promise<string>
```

### Exec spec

Holds all the functions necessary for running the tools node-config depends on (aka 7-zip and tar)

```
/**
 * Interface for exec options
 */
export interface IExecOptions

/**
* Exec a command.
* Output will be streamed to the live console.
* Returns promise with return code
* 
* @param     commandLine        command to execute
* @param     args               optional additional arguments
* @param     options            optional exec options.  See IExecOptions
* @returns   Promise<number>    return code
*/
export function exec(commandLine: string, args?: string[], options?: IExecOptions): Promise<number> 
```

### Tool-Cache spec:

Holds all the functions necessary for downloading and caching node.

```
/**
 * Download a tool from an url and stream it into a file
 *
 * @param url       url of tool to download
 * @returns         path to downloaded tool
 */
export async function downloadTool(url: string): Promise<string>

/**
 * Extract a .7z file
 *
 * @param file     path to the .7z file
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extract7z(file: string, dest?: string): Promise<string>

/**
 * Extract a tar
 *
 * @param file     path to the tar
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extractTar(file: string, destination?: string): Promise<string>

/**
 * Caches a directory and installs it into the tool cacheDir
 *
 * @param sourceDir    the directory to cache into tools
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
export async function cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string>

/**
 * finds the path to a tool in the local installed tool cache
 *
 * @param toolName      name of the tool
 * @param versionSpec   version of the tool
 * @param arch          optional arch.  defaults to arch of computer
 */
export function find(toolName: string, versionSpec: string, arch?: string): string

/**
 * Prepends inputPath to the PATH
 * @param inputPath
 */
export function addPath(inputPath: string): void
```
