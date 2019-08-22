# Creating a JavaScript Action

The [javascript-template](https://github.com/actions/javascript-template) repo contains everything you need to get started.

# Create a Repo from the Template

Navigate to https://github.com/actions/javascript-template

Click on `Use this template` to create the repo for your action.

![template](assets/node12-template.png)

Complete creating your repo and clone the repo.

> NOTE: The location of the repo will be how users will reference your action in their workflow file with the using keyword.

e.g. To use https://github.com/actions/setup-node, user's will author:

```yaml
steps:
    uses: actions/setup-node@master
```

# Dev Workflow

The workflow below describes one possible workflow with a branching strategy.  Others exist.  

> Key Point: the branch that users reference in their workflow files should reference an action that has **only** the production dependencies. 

The workflow below describes a strategy where you code in master (with node_modules ignored) with a v1 branch users reference and contains the product references.  Actions are self contained referenced on the github graph of repos.

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

## Publish a v1-release Action

After changing some files, create a v1-release branch which we will release 

```bash
$ git checkout -b v1-release
```

> NOTE: We will provide tooling and an action to automate this soon.

Check in production dependencies:
1. **Do not ignore node_modules**:  Add a `!` in front of the `node_modules` line.
2. **Delete node_modules**: rm -Rf node_modules
3. **Install production dependencies**: npm install --production
4. **Add**: git add node_modules


Simply commit and push your action to publish.

```bash
$ git commit -a -m "publishing v1 of action"
$ git push
```

> NOTE: Consider versioning your actions with tags.  See [versioning](action-versioning.md)

## Test End To End

Once the action has a self contained version in the v1-release branch, you can test it by referencing the latest (and potentially unstable) version in the release branch.  If you are fixing an issue that someone else is having with your action, you can have them try it before you officially releasing it as the 'v1' version.

```yaml
steps:
    using: {org}/{reponame}@v1-release
```

## Release Current Changes as v1

Once you have tested end to end, push a tag of 'v1' to the commit in the release branch.

See [action versioning](action-versioning.md) for more details.

# Users Referencing

Users can now reference your action in their workflows with

```yaml
steps:
    using: {org}/{reponame}@v1
```



