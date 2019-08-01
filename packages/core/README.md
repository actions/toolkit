# `@actions/core`

> Core functions for setting results, logging, registering secrets and exporting variables across actions

## Usage

You can use this library to get inputs or set outputs:

```
const core = require('@actions/core');

const myInput = core.getInput('inputName', { required: true });

// Do stuff

core.setOutput('outputKey', 'outputVal');
```

You can also export variables and secrets for future steps. Variables get set in the environment automatically, a secret with key `FOO` must be scoped into the environment from a workflow using `{{ secret.FOO }}` and will be masked from the logs:

```
const core = require('@actions/core');

// Do stuff

core.exportVariable('envVar', 'Val');
core.exportSecret('secretVar', variableWithSecretValue);
```

You can explicitly add items to the path for all remaining steps:

```
const core = require('@actions/core');

core.addPath('pathToTool');
```

You should use this library to set the exit code for your action:

```
const core = require('@actions/core');

try {
  if (work to do) {
    // Do work
  } else {
    // Set neutral indicates that the action terminated but did not fail (aka there was no work to be done)
    core.setNeutral();
  }
}
catch (err) {
  // setFailed logs the message and sets a failing exit code
  core.setFailed(`Action failed with error ${err}`);
}

```

Finally, this library provides some utilities for logging:

```
const core = require('@actions/core');

const myInput = core.getInput('input');
try {
  core.debug('Inside try block');
  
  if (!myInput) {
    core.warning('myInput wasnt set');
  }
  
  // Do stuff
}
catch (err) {
  core.error('Error ${err}, action may still succeed though');
}
```
