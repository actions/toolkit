# Github Package

In order to support using actions to interact with GitHub, I propose adding a `github` package to the toolkit.

Its main purpose will be to provide a hydrated GitHub context/Octokit client with some convenience functions. It is largely pulled from the GitHub utilities provided in https://github.com/JasonEtco/actions-toolkit, though it has been condensed.

### Spec

##### interfaces.ts

```ts
/*
 * Interfaces
 */
 
export interface PayloadRepository {
  [key: string]: any
  full_name?: string
  name: string
  owner: {
    [key: string]: any
    login: string
    name?: string
  }
  html_url?: string
}

export interface WebhookPayloadWithRepository {
  [key: string]: any
  repository?: PayloadRepository
  issue?: {
    [key: string]: any
    number: number
    html_url?: string
    body?: string
  }
  pull_request?: {
    [key: string]: any
    number: number
    html_url?: string
    body?: string
  }
  sender?: {
    [key: string]: any
    type: string
  }
  action?: string
  installation?: {
    id: number
    [key: string]: any
  }
}
```

##### context.ts

Contains a GitHub context

```ts
export class Context {
   /**
   * Webhook payload object that triggered the workflow
   */
  public payload: WebhookPayloadWithRepository

  /**
   * Name of the event that triggered the workflow
   */
  public event: string
  public sha: string
  public ref: string
  public workflow: string
  public action: string
  public actor: string
  
  /**
   * Hydrate the context from the environment
   */
  constructor ()
  
  public get issue ()
  
  public get repo ()
}

```

##### github.ts

Contains a hydrated Octokit client

```ts
export class GithubClient extends Octokit {
 // For making GraphQL requests
 public graphql: (query: string, variables?: Variables) => Promise<GraphQlQueryResponse>
 
 // Calls super and initializes graphql
 constructor (token: string)
}
```
