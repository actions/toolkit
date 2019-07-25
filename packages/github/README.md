# `@actions/github`

> A hydrated Octokit client.

## Usage

Returns an [Octokit SDK] client. See https://octokit.github.io/rest.js for the API.

```
const github = require('@actions/github');

// This should be a token with access to your repository scoped in as a secret.
const myToken = process.env.GITHUB_TOKEN

const octokit = new github.GitHub(myToken)

const pulls = await octokit.pulls.get({
    owner: 'octokit',
    repo: 'rest.js',
    pull_number: 123,
    mediaType: {
      format: 'diff'
    }
})

console.log(pulls)
```

You can also make GraphQL requests:

```
const result = await octokit.graphql(query, variables)
```

Finally, you can get the context of the current action:

```
const github = require('@actions/github');

const context = github.context

const newIssue = await octokit.issues.create({
  ...context.repo,
  title: 'New issue!',
  body: 'Hello Universe!'
})
```