# :: Commands

The [core toolkit package](https://github.com/actions/toolkit/tree/main/packages/core) offers a number of convenience functions for
setting results, logging, registering secrets and exporting variables across actions. Sometimes, however, its useful to be able to do
these things in a script or other tool.

To allow this, we provide a special `::` syntax which, if logged to `stdout` on a new line, will allow the runner to perform special behavior on
your commands. The following commands are all supported:

### Set outputs

To set an output for the step, use `::set-output`:

```sh
echo "::set-output name=FOO::BAR"
```

Running `steps.[step-id].outputs.FOO` in your Yaml will now give you `BAR`

```yaml
steps:
  - name: Set the value
    id: step_one
    run: echo "::set-output name=FOO::BAR"
  - name: Use it
    run: echo ${{ steps.step_one.outputs.FOO }}
```

This is wrapped by the core setOutput method:

```javascript
export function setOutput(name: string, value: string): void {}
```

### Register a secret

If a script or action does work to create a secret at runtime, it can be registered with the runner to be masked in logs.

To mask a value in the logs, use `::add-mask`:

```sh
echo "::add-mask::mysecretvalue"
```

This is wrapped by the core setSecret method

```javascript
function setSecret(secret: string): void {}
```

Now, future logs containing BAR will be masked. E.g. running `echo "Hello FOO BAR World"` will now print `Hello FOO **** World`.

**WARNING** The add-mask and setSecret commands only support single-line
secrets or multi-line secrets that have been escaped. `@actions/core`
`setSecret` will escape the string you provide by default. When an escaped
multi-line string is provided the whole string and each of its lines
individually will be masked. For example you can mask `first\nsecond\r\nthird`
using:

```sh
echo "::add-mask::first%0Asecond%0D%0Athird"
```

This will mask `first%0Asecond%0D%0Athird`, `first`, `second` and `third`.

**WARNING** Do **not** mask short values if you can avoid it, it could render your output unreadable (and future steps' output as well).
For example, if you mask the letter `l`, running `echo "Hello FOO BAR World"` will now print `He*********o FOO BAR Wor****d`

### Group and Ungroup Log Lines

Emitting a group with a title will instruct the logs to create a collapsible region up to the next endgroup command.

```bash
echo "::group::my title"   
echo "::endgroup::"
```

This is wrapped by the core methods:

```javascript
function startGroup(name: string): void {}
function endGroup(): void {}
```

### Problem Matchers

Problems matchers can be used to scan a build's output to automatically surface lines to the user that matches the provided pattern. A file path to a .json Problem Matcher must be provided. See [Problem Matchers](problem-matchers.md) for more information on how to define a Problem Matcher.

```bash
echo "::add-matcher::eslint-compact-problem-matcher.json"   
echo "::remove-matcher owner=eslint-compact::"
```

`add-matcher` takes a path to a Problem Matcher file
`remove-matcher` removes a Problem Matcher by owner

### Save State

Save a state to an environmental variable that can later be used in the main or post action.

```bash
echo "::save-state name=FOO::foovalue"
```

Because `save-state` prepends the string `STATE_` to the name, the environment variable `STATE_FOO` will be available to use in the post or main action. See [Sending Values to the pre and post actions](https://help.github.com/en/actions/reference/workflow-commands-for-github-actions#sending-values-to-the-pre-and-post-actions) for more information.

### Log Level

There are several commands to emit different levels of log output:

| log level | example usage |
|---|---|
| [debug](action-debugging.md)  | `echo "::debug::My debug message"` |
| notice | `echo "::notice::My notice message"` |
| warning | `echo "::warning::My warning message"` |
| error | `echo "::error::My error message"` |

Additional syntax options are described at [the workflow command documentation](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-a-debug-message).

### Command Echoing

By default, the echoing of commands to stdout only occurs if [Step Debugging is enabled](./action-debugging.md#How-to-Access-Step-Debug-Logs)

You can enable or disable this for the current step by using the `echo` command.

```bash
echo "::echo::on"
```

You can also disable echoing.

```bash
echo "::echo::off"
```

This is wrapped by the core method:

```javascript
function setCommandEcho(enabled: boolean): void {}
```

The `add-mask`, `debug`, `warning` and `error` commands do not support echoing.

### Command Prompt

CMD processes the `"` character differently from other shells when echoing. In CMD, the above snippets should have the `"` characters removed in order to correctly process. For example, the set output command would be:

```cmd
echo ::set-output name=FOO::BAR
```

## Environment files

During the execution of a workflow, the runner generates temporary files that can be used to perform certain actions. The path to these files are exposed via environment variables. You will need to use the `utf-8` encoding when writing to these files to ensure proper processing of the commands. Multiple commands can be written to the same file, separated by newlines.

### Set an environment variable

To set an environment variable for future out of process steps, write to the file located at `GITHUB_ENV` or use the equivalent `actions/core` function

```sh
echo "FOO=BAR" >> $GITHUB_ENV
```

Running `$FOO` in a future step will now return `BAR`

For multiline strings, you may use a heredoc style syntax with your choice of delimeter. In the below example, we use `EOF`.

```
steps:
  - name: Set the value
    id: step_one
    run: |
        echo 'JSON_RESPONSE<<EOF' >> $GITHUB_ENV
        curl https://httpbin.org/json >> $GITHUB_ENV
        echo 'EOF' >> $GITHUB_ENV
```

This would set the value of the `JSON_RESPONSE` env variable to the value of the curl response.

The expected syntax for the heredoc style is:

```
{VARIABLE_NAME}<<{DELIMETER}
{VARIABLE_VALUE}
{DELIMETER}
```

This is wrapped by the core `exportVariable` method which sets for future steps but also updates the variable for this step.

```javascript
export function exportVariable(name: string, val: string): void {}
```

### PATH Manipulation

To prepend a string to PATH write to the file located at `GITHUB_PATH` or use the equivalent `actions/core` function

```sh
echo "/Users/test/.nvm/versions/node/v12.18.3/bin" >> $GITHUB_PATH
```

Running `$PATH` in a future step will now return `/Users/test/.nvm/versions/node/v12.18.3/bin:{Previous Path}`;

This is wrapped by the core addPath method:

```javascript
export function addPath(inputPath: string): void {}
```

### Powershell

Powershell does not use UTF8 by default. You will want to make sure you write in the correct encoding. For example, to set the path:

```
steps:
  - run: echo "mypath" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
```
