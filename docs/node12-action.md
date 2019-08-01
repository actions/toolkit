# Creating a JavaScript Action

The [node12-template](https://github.com/actions/node12-template) repo contains everything you need to get started.

# Create a Repo from the Template

Navigate to https://github.com/actions/node12-template

Click on `Use this template` to create the repo for your action.

![template](assets/node12-template.png)

Complete creating your repo and clone the repo.

> NOTE: The location of the repo will be how users will reference your action in their workflow file with the using keyword.

e.g. To use https://github.com/actions/setup-node, user's will author:

```yaml
steps:
    using: actions/setup-node@master
```

# Install Dependencies

This will install the toolkit and other dependencies

```bash
$ npm install
```

The production dependencies are vendored into your action.  At runtime, the self contained action will be downloaded, extracted and run.

# Define Metadata

Your action has a name and a description.  Update the author.

Create inputs that your unit of work will need.  These will be what workflow authors set with the `with:` keyword.

```yaml
name: 'My new action'
description: 'A test action'
author: 'GitHub'
inputs: 
  myInput:
    description: 'Input to use'
    default: 'world'
runs:
  using: 'node12'
  main: 'lib/main.js'

```

Note that the action will be run with node 12 (carried by the runner) and the entry point is specified with `main:` 

# Change Code and Add Tests

The entry point is in main.ts

```typescript
import * as core from '@actions/core';

async function run() {
  try {
    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput}!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

Modify tests in `__tests__\main.test.ts`.  The template uses [jest](https://github.com/facebook/jest).

# Format the Code

```bash
$ npm run format
```

# Build and Test

```bash
$ npm run build

> node12-template-action@0.0.0 build /Users/user/Projects/testnode12
> tsc

$ npm test

> jest

 PASS  __tests__/main.test.ts
  TODO - Add a test suite
    ✓ TODO - Add a test (1ms)

Test Suites: 1 passed, 1 total
...
```

# Commit and Push Changes

```bash
$ git add <whatever only files you added>
$ git commit -m "Message"
```

Husky will add/vendor node_modules and prune dev dependencies.  See husky in package.json for details.  There is no need for you to add node_modules.

IMPORTANT: We understand that the process of checking in node_modules is currently somewhat painful for some use cases. We are actively tracking an enhancement in [this issue](https://github.com/actions/node12-template/issues/4) to improve this process (and are open to any suggestions :smile:).

In the meantime we still **strongly encourage** you to not check in dev-dependencies, it will significantly bloat the size of actions and degrade the experience.

# Publish Action

Simply push your action to publish.

```bash
$ git push
```

> NOTE: Consider versioning your actions with tags.  See [versioning](docs/action-versioning.md)




