/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@octokit/graphql' {
  export interface GraphQlQueryResponse {
    data: {[key: string]: any} | null
    errors?: [
      {
        message: string
        path: [string]
        extensions: {[key: string]: any}
        locations: [
          {
            line: number
            column: number
          }
        ]
      }
    ]
  }

  export interface GraphQLError {
    message: string
    locations?: {line: number; column: number}[]
    path?: (string | number)[]
    extensions?: {
      [key: string]: any
    }
  }

  export interface Variables {
    [key: string]: any
  }

  export function defaults(
    options: any
  ): (query: string, variables?: Variables) => Promise<GraphQlQueryResponse>
}
