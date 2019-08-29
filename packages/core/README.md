# `@actions/core`

> Core functions for setting results, logging, registering secrets and exporting variables across actions

## Usage

#### Inputs/Outputs

You can use this library to get inputs or set outputs:

```js
const core = require('@actions/core');

const myInput = core.getInput('inputName', { required: true });

// Do stuff

core.setOutput('outputKey', 'outputVal');
```

#### Exporting variables

You can also export variables for future steps. Variables get set in the environment.

```js
const core = require('@actions/core');

// Do stuff

core.exportVariable('envVar', 'Val');
```

#### PATH Manipulation

You can explicitly add items to the path for all remaining steps in a workflow:

```js
const core = require('@actions/core');

core.addPath('pathToTool');
```

#### Exit codes

You should use this library to set the failing exit code for your action:

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
  
  // Do stuff
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