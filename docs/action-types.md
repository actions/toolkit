# Action Types

There are two types of actions.  JavaScript and Docker actions.

- **JavaScript Actions**: JavaScript actions run on the host machine.  The unit of work is decoupled from the environment.
- **Docker Actions**: A container action is a container which carries both the unit of work along with the environment and its dependencies packaged up as a container.

Both have access to the workspace and the github event payload and context.

## Why would I choose a Docker action?

Docker actions carry both the unit of work and the environment.

This creates a more consistent and reliable unit of work where the consumer of the action does not need to worry about the toolsets and its dependencies.

Docker actions are currently limited to Linux only.

## Why would I choose a host action?

JavaScript actions decouple the unit of work from the environment and run directly on the host machine or VM.

Consider a simple example of testing a node lib on node 8, 10 and running a custom action.  Each job will setup a node version on the host and custom-action will run its unit of work on each environment (node8+ubuntu16, node8+windows-2019, etc.)

```yaml
on: push

jobs:
  build:
    strategy: 
      matrix:
        node: [8.x, 10.x]
        os: [ubuntu-16.04, windows-2019]
    runs-on: ${{matrix.os}}
    actions:
    - uses: actions/setup-node@v3
      with:
        version: ${{matrix.node}}
    - run: | 
        npm install
    - run: |
        npm test
    - uses: actions/custom-action@v1
```

JavaScript actions work on any environment that host action runtime is supported on which is currently node 12.  However, a host action that runs a toolset expects the environment that it's running on to have that toolset in its PATH or using a setup-* action to acquire it on demand.
