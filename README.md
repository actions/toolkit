
<p align="center">
  <img src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit"><img alt="GitHub Actions status" src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg"></a>
</p>

## GitHub Actions Toolkit

The GitHub Actions ToolKit provides a set of packages to make creating actions easier.

## Packages

:heavy_check_mark: [@actions/core](packages/core) provides functions for inputs, outputs, results, logging, secrets and variables

:runner: [@actions/exec](packages/exec) provides functions to exec cli tools and process output 

:pencil2: [@actions/io](packages/io) provides disk i/o functions like cp, mv, rmRF, find etc. 

:hammer: [@actions/tool-cache](packages/tool-cache) provides functions for downloading and caching tools.  e.g. setup-* actions.

:octocat: [@actions/github](packages/github) provides an Octokit client hydrated with the context that the current action is being run in

## Creating an Action with the Toolkit

Actions run in a container or on the host machine.

:question: [Choosing an action type](docs/action-types.md): Outlines the differences and why you would want to create a JavaScript or a container based action.

:rocket: [Hello World JavaScript Action](https://github.com/actions/hello-world-javascript-action): Illustrates how to create a simple hello world javascript action.

:rocket: [JavaScript Action Walkthrough](https://github.com/actions/javascript-action): Walkthrough creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

:rocket: [TypeScript Action Walkthrough](https://github.com/actions/typescript-action): Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning.

:rocket: [Docker Action Walkthrough](docs/container-action.md): Create an action that is delivered as a container and run with docker.

:rocket: [Docker Action Walkthrough with Octokit](docs/container-action-toolkit.md): Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

:curly_loop: [Versioning](docs/action-versioning.md): Recommendations on versioning, releases and tagging your action.

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).
