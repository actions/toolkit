
<p align="center">
  <img src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit"><img alt="GitHub Actions status" src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg?branch=master"></a>
</p>


## GitHub Actions Toolkit

The GitHub Actions ToolKit provides a set of packages to make creating actions easier.

<br/>
<h3 align="center">Get started with the <a href="https://github.com/actions/javascript-action">javascript-action template</a>!</h3>
<br/>

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

:ice_cream: [@actions/glob](packages/glob)

Provides functions to search for files matching glob patterns. Read more [here](packages/glob)

```bash
$ npm install @actions/glob --save
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

:floppy_disk: [@actions/artifact](packages/artifact) 

Provides functions to interact with actions artifacts. Read more [here](packages/artifact)

```bash
$ npm install @actions/artifact --save
```
<br/>

## Creating an Action with the Toolkit

:question: [Choosing an action type](docs/action-types.md)

Outlines the differences and why you would want to create a JavaScript or a container based action.
<br/>
<br/>

:curly_loop: [Versioning](docs/action-versioning.md)

Actions are downloaded and run from the GitHub graph of repos.  This contains guidance for versioning actions and safe releases.
<br/>
<br/>

:warning: [Problem Matchers](docs/problem-matchers.md)

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI.
<br/>
<br/>

:warning: [Proxy Server Support](docs/proxy-support.md)

Self-hosted runners can be configured to run behind proxy servers. 
<br/>
<br/>

<h3><a href="https://github.com/actions/hello-world-javascript-action">Hello World JavaScript Action</a></h3>

Illustrates how to create a simple hello world javascript action.

```javascript
...
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
...
```
<br/>

<h3><a href="https://github.com/actions/javascript-action">JavaScript Action Walkthrough</a></h3>
 
Walkthrough and template for creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

```javascript
async function run() {
  try { 
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
```
```javascript
PASS ./index.test.js
  ✓ throws invalid number 
  ✓ wait 500 ms 
  ✓ test runs

Test Suites: 1 passed, 1 total    
Tests:       3 passed, 3 total
```
<br/>

<h3><a href="https://github.com/actions/typescript-action">TypeScript Action Walkthrough</a></h3>

Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning.

```javascript
import * as core from '@actions/core';

async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
```
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

<h3><a href="docs/container-action.md">Docker Action Walkthrough</a></h3>

Create an action that is delivered as a container and run with docker.

```docker
FROM alpine:3.10
COPY LICENSE README.md /
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```
<br/>

<h3><a href="https://github.com/actions/container-toolkit-action">Docker Action Walkthrough with Octokit</a></h3>

Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

```docker
FROM node:slim
COPY . .
RUN npm install --production
ENTRYPOINT ["node", "/lib/main.js"]
```
```javascript
const myInput = core.getInput('myInput');
core.debug(`Hello ${myInput} from inside a container`);

const context = github.context;
console.log(`We can even get context data, like the repo: ${context.repo.repo}`)    
```
<br/>

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).

## Code of Conduct

See [our code of conduct](CODE_OF_CONDUCT.md).
