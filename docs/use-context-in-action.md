# Use the GitHub Context in an Action

## Goal

In this walkthrough, you will learn how to build a basic action using GitHub context data to greet users when they open an issue or PR. In the process, we will explore how to access this context and make authenticated requests to the GitHub API.

## Prerequisites

This walkthrough assumes that you have created a new repository using the [`actions/typescript-action`](https://github.com/actions/typescript-action) template and have a basic action set up.

For instructions, check out [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).

## Dependencies

All of the dependencies you need should come from this repository's `@actions/core` and `@actions/github` packages.

Install these packages by running the following command from within your action repository:

```bash
npm install @actions/core
npm install @actions/github
```

## Action Metadata

In order to create a greeting, your action will need two things:

- A welcome message
- Permissions to create issue/PR comments

These can be provided to your action as inputs. Inputs are defined in the [`action.yml` metadata file](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs).

Update your `action.yml` file to define two inputs: `welcome-message` and `repo-token`

```yaml
name: Welcome
description: A basic welcome action
author: GitHub

inputs:
  welcome-message:
    description: A message to display when a user opens an issue or PR
    default: Thanks for opening an issue! Make sure you've followed CONTRIBUTING.md
    required: false
  repo-token:
    description: Token for the repository (e.g. `${{ secrets.GITHUB_TOKEN }}`)
    required: true
runs:
  using: node20
  main: dist/index.js
```

## Action Logic

Now that you've installed dependencies and defined inputs, you're ready to start writing the action logic in `src/main.ts`! For clarity, you can structure the action as follows:

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const welcomeMessage: string = core.getInput('welcome-message')

    // TODO - Get context data

    // TODO - make request to the GitHub API to comment on the issue
  } catch (error: any) {
    core.setFailed(error.message)
  }
}
```

### Using Context Data

In order to comment on an issue/PR, you will need the following pieces of context data:

- The name of the repository the action is being run on
- The organization/owner of that repository
- The issue or PR number

The `@actions/github` package provides all of this via the [`github.context.issue` convenience function](https://github.com/actions/toolkit/blob/1fe633e27c4cc74616d675b71163f59f9d084381/packages/github/src/context.ts#L57).

```ts
const issue: {owner: string; repo: string; number: number} =
  github.context.issue
```

The context object contains a number of useful properties, including the full [event payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads). You can use this to check and make sure this is a recently-opened issue and not something else (like a comment on an existing issue).

```ts
if (github.context.action !== 'opened') {
  core.info('No issue or PR was opened, skipping!')
  return
}
```

The updated `src/main.ts` file should now look like:

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const welcomeMessage: string = core.getInput('welcome-message', {
      required: true
    })
    const repoToken: string = core.getInput('repo-token', {required: true})

    const issue: {owner: string; repo: string; number: number} =
      github.context.issue

    if (github.context.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping')
      return
    }

    // TODO - make request to the GitHub API to comment on the issue
  } catch (error: any) {
    core.setFailed(error.message)
    throw error
  }
}
```

### Sending Requests to the GitHub API

Now that you have the context data you need for your action, you can send a request to the GitHub API using the [Octokit REST API client](https://github.com/octokit/rest.js). The REST API client exposes a number of convenience functions, including one for adding comments to issues/PRs. For more information about the Octokit client, visit the [Octokit documentation](https://octokit.github.io/rest.js).

> [!NOTE]
>
> Issues and PRs are treated as one concept by the Octokit client.

```ts
const octokit = new github.getOctokit(repoToken)

await octokit.issues.createComment({
  owner: issue.owner,
  repo: issue.repo,
  issue_number: issue.number,
  body: welcomeMessage
})
```

Your action code should now be complete:

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const welcomeMessage: string = core.getInput('welcome-message', {
      required: true
    })
    const repoToken: string = core.getInput('repo-token', {required: true})
    const issue: {owner: string; repo: string; number: number} =
      github.context.issue

    if (github.context.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping')
      return
    }

    const octokit = github.getOctokit(repoToken)

    await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: welcomeMessage
    })
  } catch (error: any) {
    core.setFailed(error.message)
    throw error
  }
}
```

## Writing Unit Tests for your Action

Next, you're going to write a basic unit test for your action using [Jest](https://jestjs.io/). You should already have a file `__tests__/main.test.ts` that runs tests when `npm test` is called.

Remove the contents of that file and replace it with the following:

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

describe('Welcome Message Action', () => {
  it('Posts a comment on an opened issue', async () => {
    // TODO
  })
})
```

For the purposes of this walkthrough, focus on populating this test and leave the remaining test coverage for later.

### Mocking Inputs

First, you will want to make sure that you can mock the return value of the `core.getInput` function. This will simulate your action getting the `welcome-message` and `repo-token` inputs.

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

describe('Welcome Message Action', () => {
  it('Posts a comment on an opened issue', async () => {
    const welcomeMessage = 'Hello, World!'
    const repoToken = 'MY_TOKEN'

    jest
      .spyOn(core, 'getInput')
      .mockReturnValueOnce(welcomeMessage) // The first call to getInput()
      .mockReturnValueOnce(repoToken) // The second call to getInput()

    // TODO
  })
})
```

### Mocking the GitHub Context

You can simulate the GitHub context by mocking the `@actions/github` package.

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

jest.mock('@actions/github', () => ({
  context: {
    issue: {
      owner: 'octocat',
      repo: 'octo-repo',
      number: 10
    },
    action: 'opened'
  }
}))

describe('Welcome Message Action', () => {
  it('Posts a comment on an opened issue', async () => {
    const welcomeMessage = 'Hello, World!'
    const repoToken = 'MY_TOKEN'

    jest
      .spyOn(core, 'getInput')
      .mockReturnValueOnce(welcomeMessage) // The first call to getInput()
      .mockReturnValueOnce(repoToken) // The second call to getInput()

    // TODO
  })
})
```

When the test is run, your action code will import `@actions/github`, receiving the object defined in your test. When your action calls `github.context.issue`, it should receive the following:

```json
{
  "owner": "octocat",
  "repo": "octo-repo",
  "number": 10
}
```

### Mocking the Octokit Client

You can mock the REST API client simply by expanding the mock you defined in the previous step. Specifically, your mock will need to return a client from the `getOctokit` function call. If you set this up as a spy instance, you can then test to confirm when and how the client was called. In the following example, `mocktokit` acts as the mock REST API client.

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    issue: {
      owner: 'octocat',
      repo: 'octo-repo',
      number: 10
    },
    action: 'opened'
  }
}))

describe('Welcome Message Action', () => {
  it('Posts a comment on an opened issue', async () => {
    const welcomeMessage = 'Hello, World!'
    const repoToken = 'MY_TOKEN'
    const mocktokit = {
      rest: {
        issues: {
          createComment: jest.fn()
        }
      }
    }

    jest
      .spyOn(core, 'getInput')
      .mockReturnValueOnce(welcomeMessage) // The first call to getInput()
      .mockReturnValueOnce(repoToken) // The second call to getInput()

    // The call to getOctokit()
    jest.spyOn(github, 'getOctokit').mockReturnValue(mocktokit as any)

    // TODO
  })
})
```

The last step is to call your action and test the outcome. In this case, you will want to make sure that your action posts a comment to the issue. This can be done by checking if `createComment` was called.

```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as main from '../src/main'

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    issue: {
      owner: 'octocat',
      repo: 'octo-repo',
      number: 10
    },
    action: 'opened'
  }
}))

describe('Welcome Message Action', () => {
  it('Posts a comment on an opened issue', async () => {
    const welcomeMessage = 'Hello, World!'
    const repoToken = 'MY_TOKEN'
    const mocktokit = {
      rest: {
        issues: {
          createComment: jest.fn()
        }
      }
    }

    jest
      .spyOn(core, 'getInput')
      .mockReturnValueOnce(welcomeMessage) // The first call to getInput()
      .mockReturnValueOnce(repoToken) // The second call to getInput()

    jest.spyOn(github, 'getOctokit').mockReturnValue(mocktokit as any)

    await main.run()

    expect(mocktokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'octocat',
      repo: 'octo-repo',
      issue_number: 10,
      body: welcomeMessage
    })
  })
})
```

## Build and Publish

Now that you've developed and tested your action, you can build and publish it for others to include in their workflows!

1. Build the action

   ```bash
   npm run all
   ```

   This will check the formatting, run linting, perform unit tests, and build the action code.

1. Commit your changes
1. Open a pull request

For more info on versioning your action, see [Action Versioning](./action-versioning.md).

## Next steps

If you're interested in building out this action further, try extending your action to only run on a user's first issue. See our [`actions/first-interaction`](https://github.com/actions/first-interaction) for inspiration.
