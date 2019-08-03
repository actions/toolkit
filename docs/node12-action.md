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

# Dev Workflow

The workflow below describes one possible workflow with a branching strategy.  Others exist.  

> Key Point: the branch that users reference in their workflow files should reference an action that has **only** the production dependencies. 

The workflow below describes a strategy where you code in master (with node_modules ignored) with a V1 branch users reference and contains the product references.  Actions are self contained referenced on the github graph of repos.

## Install Dependencies

After creating a repo from the template and cloning it, you will be in master.  The command below will install the toolkit, other dependencies and dev dependencies

```bash
$ npm install
```

## Define Metadata

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

## Change Code and Add Tests

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

## Format the Code

```bash
$ npm run format
```

## Build and Test

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

## Commit and Push Changes

```bash
$ git add <whatever only files you added>
$ git commit -m "Message"
```

> husky will add/vendor node_modules and prune dev dependencies.  See husky in package.json for details.  There is no need for you to add node_modules.

## Publish a V1 Action

After changing some files, create a V1 branch which we will release 

```bash
$ git checkout -b V1
```

> NOTE: We will provide tooling and an action to automate this soon.

Checkin production dependencies:
1. **Do not ignore node_modules**:  Add a `!` in front of the `node_modules` line.
2. **Delete node_modules**: rm -Rf node_modules
3. **Install production dependencies**: npm install --production
4. **Add**: git add node_modules


Simply commit and push your action to publish.

```bash
$ git commit -a -m "publishing V1 of action"
$ git push
```

> NOTE: Consider versioning your actions with tags.  See [versioning](docs/action-versioning.md)

# Users Referencing

Users can now reference your action in their workflows with

```yaml
steps:
    using: {org}/{reponame}@V1
```




