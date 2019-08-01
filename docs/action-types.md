# Action Types

There are two types of actions.  Host actions and container actions.

- **Host Actions**: Host actions run on the host machine.  The unit of work is decoupled from the environment.
- **Container Actions**: A container action is a container which carries both the unit of work along with the environment and it's dependencies packaged up as a container.

Both have access to the workspace and the github event payload and context.

## Why would I choose a container action?

Container actions carry both the unit of work and the environment and toolsets and their dependencies.

Container actions are limited to Linux only.

## Why would I choose a host action?

Host actions decouple the unit of work from 

Consider a simple example of testing a node lib on node 8, 10 and running a custom action.  Each job will setup a node version on the host and custom-action will run it's unit of work on each environment (node8+ubunut16, node8+windows-2019, etc.)

Host actions work on any environment that host action runtime is supported on which is currently node 12.

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
    - uses: actions/setup-node@master
      with:
        version: ${{matrix.node}}
    - run: | 
        npm install
    - run: |
        npm test
    - uses: actions/custom-action@master
```