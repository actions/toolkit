# `@actions/glob`

## Usage

### Basic

You can use this package to search for files matching glob patterns.

Relative paths and absolute paths are both allowed. Relative paths are rooted against the current working directory.

```js
const glob = require('@actions/glob');

const patterns = ['**/tar.gz', '**/tar.bz']
const globber = await glob.create(patterns.join('\n'))
const files = await globber.glob()
```

### Opt out of following symbolic links

```js
const glob = require('@actions/glob');

const globber = await glob.create('**', {followSymbolicLinks: false})
const files = await globber.glob()
```

### Iterator

When dealing with a large amount of results, consider iterating the results as they are returned:

```js
const glob = require('@actions/glob');

const globber = await glob.create('**')
for await (const file of globber.globGenerator()) {
  console.log(file)
}
```

## Recommended action inputs

Glob follows symbolic links by default. Following is often appropriate unless deleting files.

Users may want to opt-out from following symbolic links for other reasons. For example,
excessive amounts of symbolic links can create the appearance of very, very many files
and slow the search.

When an action allows a user to specify input patterns, it is generally recommended to
allow users to opt-out from following symbolic links.

Snippet from `action.yml`:

```yaml
inputs:
  files:
    description: 'Files to print'
    required: true
  follow-symbolic-links:
    description: 'Indicates whether to follow symbolic links'
    default: true
```

And corresponding toolkit consumption:

```js
const core = require('@actions/core')
const glob = require('@actions/glob')

const globOptions = {
  followSymbolicLinks: core.getInput('follow-symbolic-links').toUpper() !== 'FALSE'
}
const globber = glob.create(core.getInput('files'), globOptions)
for await (const file of globber.globGenerator()) {
  console.log(file)
}
```

## Hashing files (`hashFiles`)

`hashFiles` computes a hash of files matched by glob patterns.

By default, only files under the workspace (`GITHUB_WORKSPACE`) are eligible to be hashed.

To improve security, file eligibility is evaluated using each file's resolved (real) path to prevent symbolic link traversal outside the allowed root path(s).

### Options

- `roots?: string[]` — Allowlist of root paths. Only files that resolve under (or equal) one of these roots are hashed. Defaults to `[GITHUB_WORKSPACE]` (or `currentWorkspace` if provided).
- `allowFilesOutsideWorkspace?: boolean` — Explicit opt-in to include files outside the specified root path(s). Defaults to `false`.
- `exclude?: string[]` — Glob patterns to exclude from hashing. Defaults to `[]`.

If files match your patterns but are outside the allowed roots and `allowFilesOutsideWorkspace` is not enabled, those files are skipped and a warning is emitted. If no eligible files remain after filtering, `hashFiles` returns an empty string (`''`).

### Example

```js
const glob = require('@actions/glob')

const hash = await glob.hashFiles('**/*.json', process.env.GITHUB_WORKSPACE || '', {
  roots: [process.env.GITHUB_WORKSPACE, process.env.GITHUB_ACTION_PATH].filter(Boolean),
  allowFilesOutsideWorkspace: true,
  exclude: ['**/node_modules/**']
})

console.log(hash)
```

## Patterns

### Glob behavior

Patterns `*`, `?`, `[...]`, `**` (globstar) are supported.

With the following behaviors:
- File names that begin with `.` may be included in the results
- Case insensitive on Windows
- Directory separator `/` and `\` both supported on Windows

### Tilde expansion

Supports basic tilde expansion, for current user HOME replacement only.

Example:
- `~` may expand to /Users/johndoe
- `~/foo` may expand to /Users/johndoe/foo

### Comments

Patterns that begin with `#` are treated as comments.

### Exclude patterns

Leading `!` changes the meaning of an include pattern to exclude.

Multiple leading `!` flips the meaning.

### Escaping

Wrapping special characters in `[]` can be used to escape literal glob characters
in a file name. For example the literal file name `hello[a-z]` can be escaped as `hello[[]a-z]`.

On Linux/macOS `\` is also treated as an escape character.
