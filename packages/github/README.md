# `@actions/github`

> A hydrated Octokit client.

## Usage

Returns an Octokit client. See https://octokit.github.io/rest.js for the API.

```js
const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const myToken = core.getInput('myToken');

    const octokit = new github.GitHub(myToken);

    const { data: pullRequest } = await octokit.pulls.get({
        owner: 'octokit',
        repo: 'rest.js',
        pull_number: 123,
        mediaType: {
          format: 'diff'
        }
    });

    console.log(pullRequest);
}

run();
```

You can pass client options (except `auth`, which is handled by the token argument), as specified by [Octokit](https://octokit.github.io/rest.js/), as a second argument to the `GitHub` constructor.

You can also make GraphQL requests. See https://github.com/octokit/graphql.js for the API.

```js
const result = await octokit.graphql(query, variables);
```

Finally, you can get the context of the current action:

```js
const github = require('@actions/github');

const context = github.context;

const newIssue = await octokit.issues.create({
  ...context.repo,
  title: 'New issue!',
  body: 'Hello Universe!'
});
```

## Webhook Payload Typescript Definitions
`@octokit/webhooks` provides complete typescript definitions for the payloads associated with each event. You can cast the provided payload to these types for more type information as needed.

To do this, first install the npm module `npm install --save @octokit/webhooks`

Then, assert the type based on the eventName
```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as Webhooks from '@octokit/webhooks'
if (github.context.eventName === 'push') {
  const pushPayload = github.context.payload as Webhooks.WebhookPayloadPush
  core.info(`The head commit is: ${pushPayload}`)
}
```