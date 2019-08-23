# Creating an Action using the GitHub Context

## Goal

In this walkthrough we will learn how to build a basic action using GitHub context data to greet users when they open an issue. In the process we will explore how to access this context and how to make authenticated requests to the GitHub API.

Note that a complete version of this action can be found at https://github.com/damccorm/issue-greeter.

## Prerequisites

This walkthrough assumes that you have gone through the basic [javascript action walkthrough](./javascript-action) and have a basic action set up. If not, we recommend you go through that first.

## Installing dependencies

All of the dependencies we need should come packaged for us in this library's github package. To install, run the following in your action:

`npm install @actions/github`

## Metadata

Next, we will need a welcome message and a repo-token as an input. Recall that inputs are defined in the `action.yml` metadata file - update your `action.yml` file to define `welcomeMessage` as an input.

```yaml
name: 'Welcome'
description: 'A basic welcome action'
author: 'GitHub'
inputs: 
  welcome-message:
    description: 'Message to display on a user's first issue'
    default: 'Welcome to my repo'
runs:
  using: 'node12'
  main: 'lib/main.js'
```

## Action logic

Now that we've installed our dependencies and defined our inputs, we're ready to start writing the action logic in `src/main.ts`! For clarity, we'll structure our action up as follows:

```
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
    try {
    const welcomeMessage: string = core.getInput('welcome-message');
    // TODO - Get context data

    // TODO - make request to the GitHub API to comment on the issue 
    }
    catch (error) {
      core.setFailed(error.message);
    }
}

run();
```

### Getting Context Data

For the purpose of this walkthrough, we will need the following pieces of context data:

- the name of the repo that the action is being run on
- the organization/owner of that repo
- the number of the issue that has been opened

Fortunately, the GitHub package provides all of this to us with [a single convenience function](https://github.com/actions/toolkit/blob/ac007c06984bc483fae2ba649788dfc858bc6a8b/packages/github/src/context.ts#L34), so we can simply do:

`const issue: {owner: string; repo: string; number: number} = github.context.issue;`

The context object also contains a number of easily accessed properties, as well as easy access to the full [GitHub payload](https://developer.github.com/v3/activity/events/types/). We can use this to check and make sure we're actually looking at a recently opened issue (and not something else, like a comment on an existing issue):

```
if (context.payload.action !== 'opened') {
  console.log('No issue or PR was opened, skipping');
  return;
}
```

So our whole `src/main.ts` file now looks like:

```
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
    try {
    const welcomeMessage: string = core.getInput('welcome-message', {required: true});
    const repoToken: string = core.getInput('repo-token', {required: true});
    const issue: {owner: string; repo: string; number: number} = github.context.issue;

    if (context.payload.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping');
      return;
    }

    // TODO - make request to the GitHub API to comment on the issue 
    }
    catch (error) {
      core.setFailed(error.message);
    }
}

run();
```

### Sending Requests to the GitHub API

Now that we have our context data, we are able to send a request to the GitHub API using the [Octokit REST client](https://github.com/octokit/rest.js). The REST client exposes a number of easy convenience functions, including one for adding comments to issues:

```
const client: github.GitHub = new github.GitHub(repoToken);
await github.client.issues.createComment({
  owner: issue.owner,
  repo: issue.repo,
  issue_number: issue.number,
  body: welcome-message
});
```

For more docs on the client, you can visit the [Octokit REST documentation](https://octokit.github.io/rest.js/).

### Build and publish

Now that we've written our source code, we can build our action with `npm run build` and push it to a repo where it can be consumed by workflows. For more info on versioning your action, see [our versioning docs](./action-versioning.md).

## Testing your action

// TODO

## Next steps

If you're interested in building out this action further, try extending your action to only run on a user's first issue. See our [first-contribution action](https://github.com/actions/first-interaction) for inspiration.