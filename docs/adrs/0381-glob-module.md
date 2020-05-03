# ADR 381: `glob` module

**Date**: 2019-12-05

**Status**: Accepted

## Context

This ADR proposes adding a `glob` function to the toolkit.

First party actions should have a consistent glob experience.

Related to artifact upload/download v2.

## Decision

### New module

Create a new module `@actions/glob` that can be versioned at it's own pace - not tied to `@actions/io`.

### Signature

```js
/**
 * Constructs a globber from patterns
 *
 * @param patterns  Patterns separated by newlines
 * @param options   Glob options
 */
export function create(
  patterns: string,
  options?: GlobOptions
): Promise<Globber> {}

/**
 * Used to match files and directories
 */
export interface Globber {
  /**
   * Returns the search path preceding the first glob segment, from each pattern.
   * Duplicates and descendants of other paths are filtered out.
   *
   * Example 1: The patterns `/foo/*` and `/bar/*` returns `/foo` and `/bar`.
   *
   * Example 2: The patterns `/foo/*` and `/foo/bar/*` returns `/foo`.
   */
  getSearchPaths(): string[]

  /**
   * Returns files and directories matching the glob patterns.
   *
   * Order of the results is not guaranteed.
   */
  glob(): Promise<string[]>

  /**
   * Returns files and directories matching the glob patterns.
   *
   * Order of the results is not guaranteed.
   */
  globGenerator(): AsyncGenerator<string, void>
}

/**
 * Options to control globbing behavior
 */
export interface GlobOptions {
  /**
   * Indicates whether to follow symbolic links. Generally should set to false
   * when deleting files.
   *
   * @default true
   */
  followSymbolicLinks?: boolean

  /**
   * Indicates whether directories that match a glob pattern, should implicitly
   * cause all descendant paths to be matched.
   *
   * For example, given the directory `my-dir`, the following glob patterns
   * would produce the same results: `my-dir/**`, `my-dir/`, `my-dir`
   *
   * @default true
   */
  implicitDescendants?: boolean

  /**
   * Indicates whether broken symbolic should be ignored and omitted from the
   * result set. Otherwise an error will be thrown.
   *
   * @default true
   */
  omitBrokenSymbolicLinks?: boolean
}
```

### Toolkit usage

Example, do not follow symbolic links:

```js
const patterns = core.getInput('path')
const globber = glob.create(patterns, {followSymbolicLinks: false})
const files = globber.glob()
```

Example, iterator:

```js
const patterns = core.getInput('path')
const globber = glob.create(patterns)
for await (const file of this.globGenerator()) {
  console.log(file)
}
```

### Action usage

Actions should follow symbolic links by default.

Users can opt-out.

Example:

```yaml
jobs:
  build:
    steps:
      - uses: actions/upload-artifact@v1
        with:
          path: |
            **/*.tar.gz
            **/*.pkg
          follow-symbolic-links: false    # opt out, should default to true
```

### HashFiles function

Hash files should not follow symbolic links by default.

User can opt-in by specifying flag `--follow-symbolic-links`.

Example:

```yaml
jobs:
  build:
    steps:
      - uses: actions/cache@v1
        with:
          hash: ${{ hashFiles('--follow-symbolic-links', '**/package-lock.json') }}
```

### Glob behavior

Patterns `*`, `?`, `[...]`, `**` (globstar) are supported.

With the following behaviors:

- File names that begin with `.` may be included in the results
- Case insensitive on Windows
- Directory separator `/` and `\` both supported on Windows

Note:
- Refer [here](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html#Pattern-Matching) for more information about Bash glob patterns.
- Refer [here](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html) for more information about Bash glob options.

### Tilde expansion

Support basic tilde expansion, for current user HOME replacement only.

For example, on macOS:
- `~` may expand to `/Users/johndoe`
- `~/foo` may expand to `/Users/johndoe/foo`

Note:
- Refer [here](https://www.gnu.org/software/bash/manual/html_node/Tilde-Expansion.html) for more information about Bash tilde expansion.
- All other forms of tilde expansion are not supported.
- Use `os.homedir()` to resolve the HOME path

### Root and normalize paths

An unrooted pattern will be rooted using the current working directory, prior to searching. Additionally the search path will be normalized prior to searching (relative pathing removed, slashes normalized on Windows, extra slashes removed).

The two side effects are:
1. Rooted and normalized paths are always returned
2. The pattern `**` will include the working directory in the results

These side effects diverge from Bash behavior. Whereas Bash is designed to be a shell, we are designing an API. This decision is intended to improve predictability of the API results.

Note:
- In Bash, the results are not rooted when the pattern is relative.
- In Bash, the results are not normalized. For example, the results from `./*` may look like: `./foo ./bar`
- In Bash, the results from the pattern `**` does not include the working directory. However the results from `/foo/**` would include the directory `/foo`. Also the results from `foo/**` would include the directory `foo`.

## Comments

Patterns that begin with `#` are treated as comments.

## Exclude patterns

Leading `!` changes the meaning of an include pattern to exclude.

Note:
- Multiple leading `!` flips the meaning.

## Escaping

Wrapping special characters in `[]` can be used to escape literal glob characters in a file name. For example the literal file name `hello[a-z]` can be escaped as `hello[[]a-z]`.

On Linux/macOS `\` is also treated as an escape character.

## Consequences

- Publish new module `@actions/glob`
- Publish docs for the module (add link from `./README.md` to new doc `./packages/glob/README.md`)