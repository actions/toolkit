# `@actions/glob`

## Toolkit usage

### Basic

You can use this package to search for files matching glob patterns.

```js
const glob = require('@actions/glob');

const patterns = ['**/tar.gz', '**/tar.bz']
const globber = await glob.create(patterns.join('\n'))
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

### Do not follow symbolic links

Opt-out of following symbolic links:

```js
const glob = require('@actions/glob');

const globber = await glob.create('**', {followSymbolicLinks: false})
const files = await globber.glob()
```

## Recommended action inputs

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

Toolkit consumption:

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

Patterns that begin with # are treated as comments.

### Exclude patterns

Leading `!` changes the meaning of an include pattern to exclude.

Multiple leading `!` flips the meaning.

### Escaping

Wrapping special characters in `[]` can be used to escape literal glob characters
in a file name. For example the literal file name `hello[a-z]` can be escaped as `hello[[]a-z]`.

On Linux/macOS `\` is also treated as an escape character.
