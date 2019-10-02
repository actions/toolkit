
<p align="center">
  <img src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit"><img alt="GitHub Actions status" src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg"></a>
</p>

## GitHub Actions Toolkit

The GitHub Actions ToolKit provides a set of packages to make creating actions easier and drive consistency.

## Packages

The toolkit provides five separate packages.   See the docs for each action.

| Package | Description |
| ------- | ----------- |
| [@actions/core](packages/core) | Core functions for getting inputs, setting outputs, setting results, logging, secrets and environment variables |
| [@actions/exec](packages/exec) | Functions necessary for running tools on the command line |
| [@actions/io](packages/io) | Core functions for CLI filesystem scenarios |
| [@actions/tool-cache](packages/tool-cache) | Functions necessary for downloading and caching tools |
| [@actions/github](packages/github) | An Octokit client hydrated with the context that the current action is being run in |

## Creating an Action with the Toolkit

Actions run in a container or on the host machine.

[Choosing an action type](docs/action-types.md): Outlines the differences and why you would want to create a JavaScript or a container based action.

[Hello World JavaScript Action](https://github.com/actions/hello-world-javascript-action): Illustrates how to create a simple hello world javascript action.

[JavaScript Action Walkthrough](https://github.com/actions/javascript-action): Walkthrough creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

[TypeScript Action Walkthrough](https://github.com/actions/typescript-action): Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning.

[Docker Action Walkthrough](docs/container-action.md): Create an action that is delivered as a container and run with docker.

[Docker Action Walkthrough with Octokit](docs/container-action-toolkit.md): Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

[Versioning](docs/action-versioning.md): Recommendations on versioning, releases and tagging your action.

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).
