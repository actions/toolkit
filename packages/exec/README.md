# `@actions/exec`

## Usage

#### Basic

You can use this package to execute your tools on the command line in a cross platform way:

```
const exec = require('@actions/exec');

await exec.exec('node index.js');
```

#### Args

You can also pass in arg arrays:

```
const exec = require('@actions/exec');

await exec.exec('node', ['index.js', 'foo=bar']);
```

#### Output/options

Capture output or specify [other options](https://github.com/actions/toolkit/blob/d9347d4ab99fd507c0b9104b2cf79fb44fcc827d/packages/exec/src/interfaces.ts#L5):

```
const exec = require('@actions/exec');

const myOutput = '';
const myError = '';

const options = {};
options.listeners = {
  stdout: (data: Buffer) => {
    myOutput += data.toString();
  },
  stderr: (data: Buffer) => {
    myError += data.toString();
  }
};
options.cwd = './lib';

await exec.exec('node', ['index.js', 'foo=bar'], options);
```

#### Exec tools not in the PATH

You can use it in conjunction with the `which` function from `@actions/io` to execute tools that are not in the PATH:

```
const exec = require('@actions/exec');
const io = require('@actions/io');

const pythonPath: string = await io.which('python', true)

await exec.exec(`"${pythonPath}"`, ['main.py']);
```
