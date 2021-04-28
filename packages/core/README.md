# `@actions/core`

> Core functions for setting results, logging, registering secrets and exporting variables across actions

## Usage

### Import the package

```js
// javascript
const core = require('@actions/core');

// typescript
import * as core from '@actions/core';
```

#### Inputs/Outputs

Action inputs can be read with `getInput` which returns a `string` or `getBooleanInput` which parses a boolean based on the [yaml 1.2 specification](https://yaml.org/spec/1.2/spec.html#id2804923). If `required` set to be false, the input should have a default value in `action.yml`.

Outputs can be set with `setOutput` which makes them available to be mapped into inputs of other actions to ensure they are decoupled.

```js
const myInput = core.getInput('inputName', { required: true });
const myBooleanInput = core.getBooleanInput('booleanInputName', { required: true });
core.setOutput('outputKey', 'outputVal');
```

#### Exporting variables

Since each step runs in a separate process, you can use `exportVariable` to add it to this step and future steps environment blocks.

```js
core.exportVariable('envVar', 'Val');
```

#### Setting a secret

Setting a secret registers the secret with the runner to ensure it is masked in logs.

```js
core.setSecret('myPassword');
```

#### PATH Manipulation

To make a tool's path available in the path for the remainder of the job (without altering the machine or containers state), use `addPath`.  The runner will prepend the path given to the jobs PATH.

```js
core.addPath('/path/to/mytool');
```

#### Exit codes

You should use this library to set the failing exit code for your action.  If status is not set and the script runs to completion, that will lead to a success.

```js
const core = require('@actions/core');

try {
  // Do stuff
}
catch (err) {
  // setFailed logs the message and sets a failing exit code
  core.setFailed(`Action failed with error ${err}`);
}
```

Note that `setNeutral` is not yet implemented in actions V2 but equivalent functionality is being planned.

#### Logging

Finally, this library provides some utilities for logging. Note that debug logging is hidden from the logs by default. This behavior can be toggled by enabling the [Step Debug Logs](../../docs/action-debugging.md#step-debug-logs).

```js
const core = require('@actions/core');

const myInput = core.getInput('input');
try {
  core.debug('Inside try block');
  
  if (!myInput) {
    core.warning('myInput was not set');
  }
  
  if (core.isDebug()) {
    // curl -v https://github.com
  } else {
    // curl https://github.com
  }

  // Do stuff
  core.info('Output to the actions build log')
}
catch (err) {
  core.error(`Error ${err}, action may still succeed though`);
}
```

This library can also wrap chunks of output in foldable groups.

```js
const core = require('@actions/core')

// Manually wrap output
core.startGroup('Do some function')
doSomeFunction()
core.endGroup()

// Wrap an asynchronous function call
const result = await core.group('Do something async', async () => {
  const response = await doSomeHTTPRequest()
  return response
})
```

#### Styling output

Colored output is supported in the Action logs via standard [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code). 3/4 bit, 8 bit and 24 bit colors are all supported.

Foreground colors:

```js
// 3/4 bit
core.info('\u001b[35mThis foreground will be magenta')

// 8 bit
core.info('\u001b[38;5;6mThis foreground will be cyan')

// 24 bit
core.info('\u001b[38;2;255;0;0mThis foreground will be bright red')
```

Background colors:

```js
// 3/4 bit
core.info('\u001b[43mThis background will be yellow');

// 8 bit
core.info('\u001b[48;5;6mThis background will be cyan')

// 24 bit
core.info('\u001b[48;2;255;0;0mThis background will be bright red')
```

Special styles:

```js
core.info('\u001b[1mBold text')
core.info('\u001b[3mItalic text')
core.info('\u001b[4mUnderlined text')
```

ANSI escape codes can be combined with one another:

```js
core.info('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
```

> Note: Escape codes reset at the start of each line

```js
core.info('\u001b[35mThis foreground will be magenta')
core.info('This foreground will reset to the default')
```

Manually typing escape codes can be a little difficult, but you can use third party modules such as [ansi-styles](https://github.com/chalk/ansi-styles).

```js
const style = require('ansi-styles');
core.info(style.color.ansi16m.hex('#abcdef') + 'Hello world!')
```

#### Action state

You can use this library to save state and get state for sharing information between a given wrapper action:

**action.yml**:

```yaml
name: 'Wrapper action sample'
inputs:
  name:
    default: 'GitHub'
runs:
  using: 'node12'
  main: 'main.js'
  post: 'cleanup.js'
```

In action's `main.js`:

```js
const core = require('@actions/core');

core.saveState("pidToKill", 12345);
```

In action's `cleanup.js`:

```js
const core = require('@actions/core');

var pid = core.getState("pidToKill");

process.kill(pid);
```
