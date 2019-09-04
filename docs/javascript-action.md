# Creating a JavaScript Action

The [javascript-template](https://github.com/actions/javascript-template) repo contains everything you need to get started.

# Create a Repo from the Template

Navigate to https://github.com/actions/javascript-template

Click on `Use this template` to create the repo for your action.  Provide a name such as `myaction`.

![template](assets/node12-template.png)

# Clone and Update

```bash
$ git clone <repolocation>
$ cd myaction
```

Update the `author` element in the package.json file.

# Dev Workflow

The workflow below describes one possible workflow with a branching strategy.  Others exist.  

> Key Point: the branch that users reference in their workflow files should reference an action from a distribution branch that has **only** the production dependencies. 

The workflow below describes a strategy where you code in master (with node_modules ignored) with a distribution releases/v1 branch users reference via a tag.  Actions are self contained referenced from the github graph of repos, downloaded by the runner and run intact at runtime.

## Install Dependencies

After creating a repo from the template and cloning it, you will be in master.  The command below will install the toolkit, other dependencies and dev dependencies.  node_modules are ignored in the coding master branch.

```bash
$ npm install
```

## Define Metadata

Your action has a name and a description.  Update all fields .

```yaml
name: 'Hello'
description: 'Outputs Hello to a named input'
author: 'me'
inputs: 
  name:
    description: 'the name to say hello to'
    default: 'World'
runs:
  using: 'node12'
  main: 'lib/main.js'

```

The `name` input will be referenced by workflow authors using the `with:` keyword.

Note that the action will be run with node 12 (carried by the runner) and the entry point is specified with `main:` 

## Change Code and Add Tests

The entry point is in main.ts

```typescript
import * as core from '@actions/core';

async function run() {
  try {
    const nameInput = core.getInput('name');
    console.log(`Hello ${nameInput}!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

Note that tests are in `__tests__/main.test.ts`.  The template uses [jest](https://github.com/facebook/jest) to get you started with unit testing.

## Build and Test

```bash
$ npm run build

> javascript-template-action@0.0.0 build /Users/user/Projects/myaction
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

## Publish a releases/v1 Action

After changing some files, create a releases/v1 branch which we will release 

```bash
$ git checkout -b releases/v1
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
    uses: {org}/{reponame}@releases/v1
```

## Release Current Changes as v1

Once you have tested end to end, push a tag of 'v1' to the commit in the release branch.

See [action versioning](action-versioning.md) for more details.

# Users Referencing

Users can now reference your action in their workflows with

```yaml
steps:
    uses: {org}/{reponame}@v1
```



