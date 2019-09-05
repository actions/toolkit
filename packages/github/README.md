# `@actions/github`

> A hydrated Octokit client.

## Usage

Returns an Octokit client. See https://octokit.github.io/rest.js for the API.

```js
const github = require('@actions/github');
const core = require('@actions/core');

// This should be a token with access to your repository scoped in as a secret.
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
