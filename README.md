
<p align="center">
  <img src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit"><img alt="GitHub Actions status" src="https://github.com/actions/toolkit/workflows/Main%20workflow/badge.svg"></a>
</p>

## Toolkit

The toolkit provides a set of packages to make creating actions easier and drive consistency.

## Packages

The toolkit provides five separate packages.  Since actions are run by pulling actions from the github graph, dependencies including the packages are vendored into your action.

| Package | Description |
| ------- | ----------- |
| [@actions/core](packages/core) | Core functions for getting inputs, setting outputs, setting results, logging, secrets and environment variables |
| [@actions/exec](packages/exec) | Functions necessary for running tools on the command line |
| [@actions/io](packages/io) | Core functions for CLI filesystem scenarios |
| [@actions/tool-cache](packages/tool-cache) | Functions necessary for downloading and caching tools |
| [@actions/github](packages/github) | An Octokit client hydrated with the context that the current action is being run in |

## Creating an Action with the Toolkit

Actions are units of work which can either run in a container or on the host machine.

[Choosing an action type](docs/action-types.md): Outlines the differences and why you would want to create a host or a container based action.

[JavaScript Action Walthrough](docs/javascript-action.md): A full walkthrough creating an action using the toolkit along with TypeScript and Jest for unit testing.  It also covers a branching strategy for versioning and safely testing and releasing an action.

[Docker Action Walkthrough](docs/container-action.md): Create an action that is delivered as a container and run with docker.

[Docker Action Walkthrough with Octokit](docs/container-action-toolkit.md): Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

[Versioning](docs/action-versioning.md): Recommendations on versioning, releases and tagging your action.

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).
