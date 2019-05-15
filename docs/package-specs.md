# Package Specs

In order to support the node-config action, I propose adding the following into 4 libraries (tool-cache, core, io, exec), with tool-cache having dependencies on the other 3 libs:

### Tool-Cache spec:

Holds all the functions necessary for downloading and caching node.

```
/**
 * Download a tool from an url and stream it into a file
 *
 * @param url       url of tool to download
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
export function findLocalTool(toolName: string, versionSpec: string, arch?: string): string

/**
 * evaluates a list of versions and returns the latest version matching the version spec
 *
 * @param versions      an array of versions to evaluate
 * @param versionSpec   a version spec (e.g. 1.x)
 */
export function evaluateVersions(versions: string[], versionSpec: string): string
```

### Core spec

Holds all the functions necessary for interacting with the runner/environment.

```
/**
 * Gets http proxy configuration used by Build/Release agent
 *
 * @param requestUrl    optional request url being targeted. Will return null if part of runner's bypass list.
 * @return  ProxyConfiguration | null
 */
export function getHttpProxyConfiguration(requestUrl?: string): ProxyConfiguration | null

/**
 * Gets http certificate configuration used by Build/Release agent
 *
 * @return  CertConfiguration
 */
export function getHttpCertConfiguration(): CertConfiguration | null

// Logging functions
export function debug(message: string): void
export function warning(message: string): void
export function error(message: string): void

/**
 * sets env variable for this action and future actions in the job
 *
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function setVariable(name: string, val: string): void

/**
 * sets a variable which will get masked from logs
 *
 * @param name name of the secret variable 
 * @param val value of the secret variable
 */
export function setSecret(name: string, val: string): void

/**
 * Gets a variable value that is defined on the definition or set at runtime.
 * 
 * @param     name     name of the variable to get
 * @returns   string
 */
export function getVariable(name: string): string | undefined

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

/**
 * Add inputPath to the PATH
 * @param inputPath
 */
export function addPath(inputPath: string): void
```

### IO spec

Holds all the functions necessary for file system manipulation (cli scenarios, not fs replacements):

```
/**
 * Returns array of files in the given path, or in current directory if no path provided.
 *
 * @param  paths                Paths to search.
 * @param  recursive            Whether to return files from all subdirectories
 * @return Promise<string[]>    An array of files in the given path(s).
 */
export function ls(paths: string[], recursive = false): Promise<string[]>

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
 * @returns   void
 */
export function mkdirP(p: string): void

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
 * @param     tool       name of the tool
 * @param     check      whether to check if tool exists
 * @returns   string     path to tool
 */
export function which(tool: string, check?: boolean): string
```

### Exec spec

Holds all the functions necessary for running the tools node-config depends on (aka 7-zip and tar)

```
/**
 * Interface for exec options
 */
export interface IExecOptions

export class ToolRunner extends events.EventEmitter {

    /**
    * Finds the tool to be run. Returns ToolRunner for chaining
    * 
    * @param     toolPath   path to the tool to be run
    * @returns   ToolRunner
    */
    constructor(toolPath: string)

    /**
     * Add argument
     * Append an argument or an array of arguments 
     * returns ToolRunner for chaining
     * 
     * @param     val        string cmdline or array of strings
     * @returns   ToolRunner
     */
    public arg(val: string | string[]): ToolRunner

    /**
     * Parses an argument line into one or more arguments
     * e.g. .line('"arg one" two -z') is equivalent to .arg(['arg one', 'two', '-z'])
     * returns ToolRunner for chaining
     * 
     * @param     val        string argument line
     * @returns   ToolRunner
     */
    public line(val: string): ToolRunner

    /**
     * Exec a tool.
     * Output will be streamed to the live console.
     * Returns promise with return code
     * 
     * @param     options           optional exec options.  See IExecOptions
     * @returns   Promise<number>   return code
     */
    public exec(options?: IExecOptions): Promise<number>
}
```