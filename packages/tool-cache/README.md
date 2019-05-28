# `@actions/tool-cache`

> Functions necessary for downloading and caching tools.

## Usage

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
 * Extract a zip
 *
 * @param file     path to the zip
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extractZip(file: string, dest?: string): Promise<string>

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
 * Caches a downloaded file (GUID) and installs it
 * into the tool cache with a given targetName
 *
 * @param sourceFile    the file to cache into tools.  Typically a result of downloadTool which is a guid.
 * @param targetFile    the name of the file name in the tools directory
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
export async function cacheFile(sourceFile: string, targetFile: string, tool: string, version: string, arch?: string): Promise<string>

/**
 * finds the path to a tool in the local installed tool cache
 *
 * @param toolName      name of the tool
 * @param versionSpec   version of the tool
 * @param arch          optional arch.  defaults to arch of computer
 */
export function find(toolName: string, versionSpec: string, arch?: string): string
```
