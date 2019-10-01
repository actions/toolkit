# :: Commands

The [core toolkit package](https://github.com/actions/toolkit/tree/master/packages/core) offers a number of convenience functions for
setting results, logging, registering secrets and exporting variables across actions. Sometimes, however, its useful to be able to do
these things in a script or other tool.

To allow this, we provide a special `::` syntax which, if logged to `stdout` on a new line, will allow the runner to perform special behavior on
your commands. The following commands are all supported:

### Set an environment variable

To set an environment variable for future out of process steps, use `::set-env`:

```sh
echo ::set-env name=FOO::BAR
```

Running `$FOO` in a future step will now return `BAR`

This is wrapped by the core exportVariable method which sets for future steps but also updates the variable for this step

```javascript
export function exportVariable(name: string, val: string): void {}
```

### PATH Manipulation

To prepend a string to PATH, use `::addPath`:

```sh
echo ::add-path::BAR
```

Running `$PATH` in a future step will now return `BAR:{Previous Path}`;

This is wrapped by the core addPath method:
```javascript
export function addPath(inputPath: string): void {}
```

### Set outputs

To set an output for the step, use `::set-output`:

```sh
echo ::set-output name=FOO::BAR
```

Running `steps.[step-id].outputs.FOO` in your Yaml will now give you `BAR`

```yaml
steps:
  - name: Set the value
    id: step_one
    run: echo ::set-output name=FOO::BAR
  - name: Use it
    run: echo ${{ steps.step_one.outputs.FOO }}
```

This is wrapped by the core setOutput method:

```javascript
export function setOutput(name: string, value: string): void {}
```

### Register a secret

If a script or action does work to create a secret at runtime, it can be registered with the runner to be masked in logs.

To mask a value in the logs, use `::set-secret`:

```sh
echo ::set-secret::BAR
```

This is wrapped by the core method which both sets the value as a variable for future steps and registers the secret to mask
```javascript
function exportSecret(name: string, val: string): void {}
```

Now, future logs containing BAR will be masked. E.g. running `echo "Hello FOO BAR World"` will now print `Hello FOO **** World`.

CAUTION: Do **not** mask short values if you can avoid it, it could render your output unreadable (and future steps' output as well).
For example, if you mask the letter `l`, running `echo "Hello FOO BAR World"` will now print `He*********o FOO BAR Wor****d`

### Group and Ungroup Log Lines

Emitting a group with a title will instruct the logs to create a collapsable region up to the next ungroup command.

```bash
echo ::group::my title   
echo ::endgroup::
```

This is wrapped by the core methods:

```javascript
function startGroup(name: string): void {}
function endGroup(): void {}
```

### Log Level

Finally, there are several commands to emit different levels of log output:

| log level | example usage |
|---|---|
| [debug](https://github.com/actions/toolkit/blob/master/docs/action-debugging.md)  | `echo ::debug::My debug message` |
| warning | `echo ::warning::My warning message` |
| error | `echo ::error::My error message` |
