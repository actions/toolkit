
<p align="center">
  <img src="res/at-logo.png">
</p>

## Toolkit

A set of packages to make creating actions easier and drive consistency.

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

[Choosing an action type](docs/action-types.md)

[Walk-through to create a host action](docs/node12-action.md)

[Walk-through to create a container action](docs/container-action.md)

## Reference Examples

Examples of actions using the toolkit:

## Contributing

We welcome contributions.  See [how to contribute](docs/contribute.md).