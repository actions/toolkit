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

#### Output/options

Capture output or specify [other options](https://github.com/actions/toolkit/blob/d9347d4ab99fd507c0b9104b2cf79fb44fcc827d/packages/exec/src/interfaces.ts#L5):

```js
const exec = require('@actions/exec');

let myOutput = '';
let myError = '';

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

You can specify the full path for tools not in the PATH:

```js
const exec = require('@actions/exec');

await exec.exec('"/path/to/my-tool"', ['arg1']);
```

#### CommandRunner

CommandRunner is a more feature-rich alternative to `exec.getExecOutput`, it adds another level of abstraction to adjust behavior depending on execution results.

Example with echo command on different platforms
```js
const commandRunner = exec.createCommandRunner()

// Set command and arguments that are platform-specific
if (IS_WINDOWS) {
  runner.setCommand(await io.which('cmd', true))
  runner.setArgs(['/c', 'echo'])
} else {
  runner.setCommand(await io.which('echo', true))
}

// Set arguments that should be added regardless of platform
runner.setArgs((...args) => [...args, 'hello', 'world'])

// Run just like exec.getExecOutput
const { stdout, stderr, exitCode } = await runner.run()
```

Handling outputs example:
```js
await exec.createCommandRunner('echo', ['hello', 'world'])
  .onExecutionError('fail', 'optional fail message') // will fail action if command failed to execute
  .onStdError('log') // will log automatically generated message if command output has produced stderr
  .onExitCode('> 0', 'throw') // will throw error on non-zero exit code
  .run()
```

Handling options:  
- `onEmptyOutput('throw' | 'fail' | 'log' | handler, [, message])` - triggers on empty output
- `onExecutionError('throw' | 'fail' | 'log' | handler, [, message])` - triggers when failed to execute command itself
- `onStdError('throw' | 'fail' | 'log' | handler, [, message])` - triggers when command reports that it was executed with errors
- `onError('throw' | 'fail' | 'log' | handler, [,message])` - triggers either when failed to execute command or when command has been executed with stderr
- `onSuccess('throw' | 'fail' | 'log' | handler, [, message])` - triggers when there's no errors and exitCode equals to zero
- `onSpecificError(RegExp | string | matcherFn, 'throw' | 'fail' | 'log' | handler, [, message])` - matches specific error to handle
- `onOutput(RegExp | string | matcherFn, 'throw' | 'fail' | 'log' | handler, [, message])` - matches specific stdout to handle
- `onExitCode(string | number, 'throw' | 'fail' | 'log' | handler, [, message])` - matches specific exitCode to handle, when exitCode is passed is string it can be prefixed with an operator, i.e: `> 0`, `>= 1`, `= 31`, etc.
- `
on(eventOrEventArray,
  'throw' | 'fail' | 'log' | handler
  [, message]
  )
` - matches specific event in fasion similar to other handlers, but can be set to be triggered by different events passed as array (i.e. `['execerr', 'stderr'] - any error`) or by events not occuring using `!` prefix (i.e. `'!stdout' - empty output`), allowed events:
  - 'execerr' - command failed to run
  - 'stderr' - command had run but produced stderr
  - 'stdout' - non-empty stdout
  - 'exitcode' - non-zero exit code
  - 'ok' - non-zero exit code + no stderr + no execerr

