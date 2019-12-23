# Creating an Action using the GitHub Context

## Goal

In this walkthrough we will learn how to build a basic action using GitHub context data to greet users when they open an issue or PR. In the process we will explore how to access this context and how to make authenticated requests to the GitHub API.

Note that a complete version of this action can be found at https://github.com/damccorm/issue-greeter.

## Prerequisites

This walkthrough assumes that you have gone through the basic [javascript action walkthrough](https://github.com/actions/javascript-action) and have a basic action set up. If not, we recommend you go through that first.

## Installing dependencies

All of the dependencies we need should come packaged for us in this library's core and github packages. To install, run the following in your action:

`npm install @actions/core && npm install @actions/github`

## Metadata

Next, we will need a welcome message and a repo token as an input. Recall that inputs are defined in the `action.yml` metadata file - update your `action.yml` file to define `welcome-message` and `repo-token` as inputs.

```yaml
name: "Welcome"
description: "A basic welcome action"
author: "GitHub"
inputs:
  welcome-message:
    description: "Message to display when a user opens an issue or PR"
    default: "Thanks for opening an issue! Make sure you've followed CONTRIBUTING.md"
  repo-token:
    description: "Token for the repo. Can be passed in using {{ secrets.GITHUB_TOKEN }}"
    required: true
runs:
  using: "node12"
  main: "lib/main.js"
```

## Action logic

Now that we've installed our dependencies and defined our inputs, we're ready to start writing the action logic in `src/main.ts`! For clarity, we'll structure our action up as follows:

```ts
import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
    try {
    const welcomeMessage: string = core.getInput('welcome-message');
    // TODO - Get context data

    // TODO - make request to the GitHub API to comment on the issue 
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();
```

### Getting context data

For the purpose of this walkthrough, we will need the following pieces of context data:

- the name of the repo that the action is being run on
- the organization/owner of that repo
- the number of the issue that has been opened

Fortunately, the GitHub package provides all of this to us with [a single convenience function](https://github.com/actions/toolkit/blob/ac007c06984bc483fae2ba649788dfc858bc6a8b/packages/github/src/context.ts#L34), so we can simply do:

`const issue: {owner: string; repo: string; number: number} = github.context.issue;`

The context object also contains a number of easily accessed properties, as well as easy access to the full [GitHub payload](https://developer.github.com/v3/activity/events/types/). We can use this to check and make sure we're actually looking at a recently opened issue (and not something else, like a comment on an existing issue):

```ts
if (github.context.payload.action !== 'opened') {
  console.log('No issue or PR was opened, skipping');
  return;
}
```

Our whole `src/main.ts` file now looks like:

```ts
import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
    try {
    const welcomeMessage: string = core.getInput('welcome-message', {required: true});
    const repoToken: string = core.getInput('repo-token', {required: true});
    const issue: {owner: string; repo: string; number: number} = github.context.issue;

    if (github.context.payload.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping');
      return;
    }

    // TODO - make request to the GitHub API to comment on the issue 
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();
```

### Sending requests to the GitHub API

Now that we have our context data, we are able to send a request to the GitHub API using the [Octokit REST client](https://github.com/octokit/rest.js). The REST client exposes a number of easy convenience functions, including one for adding comments to issues/PRs (issues and PRs are treated as one concept by the Octokit client):

```ts
const client: github.GitHub = new github.GitHub(repoToken);
await client.issues.createComment({
  owner: issue.owner,
  repo: issue.repo,
  issue_number: issue.number,
  body: welcomeMessage
});
```

For more docs on the client, you can visit the [Octokit REST documentation](https://octokit.github.io/rest.js/). Now our action code should be complete:

```ts
import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
    try {
    const welcomeMessage: string = core.getInput('welcome-message', {required: true});
    const repoToken: string = core.getInput('repo-token', {required: true});
    const issue: {owner: string; repo: string; number: number} = github.context.issue;

    if (github.context.payload.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping');
      return;
    }

    const client: github.GitHub = new github.GitHub(repoToken);
    await client.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: welcomeMessage
    });
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();
```

## Writing unit tests for your action

Next, we're going to write a basic unit test for our action using jest. If you followed the [javascript walkthrough](https://github.com/actions/javascript-action), you should have a file `__tests__/main.test.ts` that runs tests when `npm test` is called. We're going to start by populating that with one test:

```ts
const nock = require('nock');
const path = require('path');

describe('action test suite', () => {
  it('It posts a comment on an opened issue', async () => {
    // TODO
  });
});
```

For the purposes of this walkthrough, we'll focus on populating this test and leave the remaining test coverage as an exercise for the reader.

### Mocking inputs

First, we want to make sure that we can mock our inputs (welcome-message, and repo-token). Actions handles inputs by populating process.env.INPUT_${input name in all caps}, so we can mock that simply by setting those environment variables:

```ts
const nock = require('nock');
const path = require('path');

describe('action test suite', () => {
  it('It posts a comment on an opened issue', async () => {
    const welcomeMessage = 'hello';
    const repoToken = 'token';
    process.env['INPUT_WELCOME-MESSAGE'] = welcomeMessage;
    process.env['INPUT_REPO-TOKEN'] = repoToken;

    // TODO
  });
});
```

### Mocking the GitHub context

Mocking the GitHub context is relatively straightforward. Since most of it is simply populated by environment variables, you can just set the corresponding environment variables defined [here](https://github.com/actions/toolkit/blob/ac007c06984bc483fae2ba649788dfc858bc6a8b/packages/github/src/context.ts#L23) and test that it works in that environment. In this case, we can setup our test with:

```ts
const nock = require('nock');
const path = require('path');

describe('action test suite', () => {
  it('It posts a comment on an opened issue', async () => {
    const welcomeMessage = 'hello';
    const repoToken = 'token';
    process.env['INPUT_WELCOME-MESSAGE'] = welcomeMessage;
    process.env['INPUT_REPO-TOKEN'] = repoToken;

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'payload.json');

    // TODO
  });
});
```

Note that the payload is loaded from GITHUB_EVENT_PATH. Since we set that to `path.join(__dirname, 'payload.json')`, we need to go save our payload there. For the purposes of this test, we can simply save the following to `__tests__/payload.json`:

```json
{
    "issue": {
        "number": 10
    },
    "action": "opened"
}
```

Now, calling `github.context.issue` should return `{owner: foo, repo: bar, number: 10}`, and `github.context.payload.action` should get set to 'opened'

> One important detail here is that because the GitHub context loads these environment variables as soon as it is required, you should set them before you require your action. In most cases, this means you need to rerequire your action in every test. If this is a problem, you can get around it by mocking the class directly using jest (or whatever framework you choose).

### Mocking the Octokit Client

To mock the client calls, we recommend using [nock](https://github.com/nock/nock) which allows you to mock the http requests made by the client. First, install nock with `npm install nock --save-dev`.

For this test, we expect the following call:

```ts
client.issues.createComment({
  owner: 'foo',
  repo: 'bar',
  issue_number: 10,
  body: 'you posted your first issue'
});
```

From [the GitHub endpoint docs](https://developer.github.com/v3/issues/comments/#create-a-comment), we expect this to get make a POST request to `https://api.github.com/repos/foo/bar/issues/10/comments` with body of `{"body":"hello"}`

We can mock this with:

```ts
const nock = require('nock');
const path = require('path');

describe('action test suite', () => {
  it('It posts a comment on an opened issue', async () => {
    const welcomeMessage = 'hello';
    const repoToken = 'token';
    process.env['INPUT_WELCOME-MESSAGE'] = welcomeMessage;
    process.env['INPUT_REPO-TOKEN'] = repoToken;

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'payload.json');

    nock('https://api.github.com')
      .persist()
      .post('/repos/foo/bar/issues/10/comments', '{\"body\":\"hello\"}')
      .reply(200);
      
    const main = require('../src/main');

    await main.run();
  });
});
```

This will fail if the url or body doesn't exactly match the parameters passed into the nock function. We can now run `npm test` and the test should succeed.

## Build and publish

Now that we've written and unit tested our action, we can build our action with `npm run build` and push it to a repo where it can be consumed by workflows. For more info on versioning your action, see [our versioning docs](./action-versioning.md).

## Next steps

If you're interested in building out this action further, try extending your action to only run on a user's first issue. See our [first-contribution action](https://github.com/actions/first-interaction) for inspiration.
