
<p align="center">
  <img src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit"><img alt="GitHub Actions status" src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg"></a>
</p>

## GitHub Actions Toolkit

The GitHub Actions ToolKit provides a set of packages to make creating actions easier.

## Packages

:heavy_check_mark: [@actions/core](packages/core) 

Provides functions for inputs, outputs, results, logging, secrets and variables. Read more [here](packages/core)

```bash
$ npm install @actions/core --save
```
<br/>

:runner: [@actions/exec](packages/exec) 

Provides functions to exec cli tools and process output. Read more [here](packages/exec)

```bash
$ npm install @actions/exec --save
```
<br/>

:pencil2: [@actions/io](packages/io) 

Provides disk i/o functions like cp, mv, rmRF, find etc. Read more [here](packages/io)

```bash
$ npm install @actions/io --save
```
<br/>

:hammer: [@actions/tool-cache](packages/tool-cache) 

Provides functions for downloading and caching tools.  e.g. setup-* actions. Read more [here](packages/tool-cache)

```bash
$ npm install @actions/tool-cache --save
```
<br/>

:octocat: [@actions/github](packages/github) 

Provides an Octokit client hydrated with the context that the current action is being run in. Read more [here](packages/github)

```bash
$ npm install @actions/github --save
```
<br/>

## Creating an Action with the Toolkit

:question: [Choosing an action type](docs/action-types.md)

Outlines the differences and why you would want to create a JavaScript or a container based action.
<br/>
<br/>

[Hello World JavaScript Action](https://github.com/actions/hello-world-javascript-action)

Illustrates how to create a simple hello world javascript action.

```javascript
...
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
...
```
<br/>
<br/>

[JavaScript Action Walkthrough](https://github.com/actions/javascript-action)
 
 Walkthrough and template for creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

 ```javascript
PASS ./index.test.js
  ✓ throws invalid number 
  ✓ wait 500 ms 
  ✓ test runs

Test Suites: 1 passed, 1 total    
Tests:       3 passed, 3 total
 ```
<br/>
<br/>

[TypeScript Action Walkthrough](https://github.com/actions/typescript-action) 

Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning.

```javascript
import * as core from '@actions/core';

async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```
<br/>
<br/>

[Docker Action Walkthrough](docs/container-action.md)

Create an action that is delivered as a container and run with docker.

```docker
FROM alpine:3.10

COPY LICENSE README.md /

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```
<br/>
<br/>

[Docker Action Walkthrough with Octokit](https://github.com/actions/container-toolkit-action)

Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

```javascript
    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput} from inside a container`);

    const context = github.context;
    console.log(`We can even get context data, like the repo: ${context.repo.repo}`)    
```
<br/>
<br/>

:curly_loop: [Versioning](docs/action-versioning.md)

Recommendations on versioning, releases and tagging your action.
<br/>
<br/>

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).
