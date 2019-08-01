
<p align="center">
  <img src="res/at-logo.png">
</p>

## Toolkit

The toolkit provides a set of packages to make creating actions easier and drive consistency.

## Packages

The toolkit provides four separate packages.  Since actions are run by pulling actions from the github graph, dependencies including the packages are vendored into your action.

| Package | Description |
| ------- | ----------- |
| [@actions/core](packages/core) | Core functions for getting inputs, setting outputs, setting results, logging, secrets and environment variables |
| [@actions/exec](packages/exec) | Functions necessary for running tools on the command line |
| [@actions/io](packages/io) | Core functions for CLI filesystem scenarios |
| [@actions/tool-cache](packages/tool-cache) | Functions necessary for downloading and caching tools |

## Creating an Action

Actions are units of work which can either run in a container or on the host machine.

[Choosing an action type](docs/action-types.md): Outlines the differences and why you would want to create a host or a container based action.

[Host Action Walthrough](docs/node12-action.md): Create an action which runs on the host using the toolkit

[Container Action Walkthrough](docs/container-action.md): Create an action that is delivered as a container.

[Container Action Walkthrough with Toolkit](docs/container-action-toolkit.md): Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client

[Versioning](docs/action-versioning.md): Recommendations on versioning, releases and tagging your action.

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).