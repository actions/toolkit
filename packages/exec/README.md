# `@actions/exec`

## Usage

#### Basic

You can use this package to execute tools in a cross platform way:

```js
const exec = require('@actions/exec');

await exec.exec('node index.js');
```

#### Args

You can also pass in arg arrays:

```js
const exec = require('@actions/exec');

await exec.exec('node', ['index.js', 'foo=bar']);
```

#### Capture stdout
To capture stdout (or stderr), use the function `getExecOutput`.
```js
const exec = require('@actions/exec');

const { stdout } = await exec.getExecOutput('node', ['index.js', 'foo=bar']);
```
#### Output/options

Specify [other options](https://github.com/actions/toolkit/blob/main/packages/exec/src/interfaces.ts#L5):

```js
const exec = require('@actions/exec');

const options = {
  silent: true,
  ignoreReturnCode: true,
};

await exec.exec('node', ['index.js', 'foo=bar'], options);
```

#### Exec tools not in the PATH

You can specify the full path for tools not in the PATH:

```js
const exec = require('@actions/exec');

await exec.exec('"/path/to/my-tool"', ['arg1']);
```
