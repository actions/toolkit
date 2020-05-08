import * as http from 'http'
import * as httpClient from '@actions/http-client'
import {graphql} from '@octokit/graphql'

// we need this type to set up a property on the GitHub object
// that has token authorization
// (it is not exported from octokit by default)
import {
  graphql as GraphQL,
  RequestParameters as GraphQLRequestParameters
} from '@octokit/graphql/dist-types/types'
import {OctokitOptions} from '@octokit/core/dist-types/types'

/**
 * Disambiguates the constructor overload parameters
 */
export function disambiguate(
  token: string | OctokitOptions,
  opts?: OctokitOptions
): [string, OctokitOptions] {
  return [
    typeof token === 'string' ? token : '',
    typeof token === 'object' ? token : opts || {}
  ]
}

export function getOctokitOptions(
  args: [string, OctokitOptions]
): OctokitOptions {
  const token = args[0]
  const options = {...args[1]} // Shallow clone - don't mutate the object provided by the caller

  // Auth
  const auth = getAuthString(token, options)
  if (auth) {
    options.auth = auth
  }

  return options
}

export function getGraphQL(args: [string, OctokitOptions]): GraphQL {
  const defaults: GraphQLRequestParameters = {}
  defaults.baseUrl = getGraphQLBaseUrl()
  const token = args[0]
  const options = args[1]

  // Authorization
  const auth = getAuthString(token, options)
  if (auth) {
    defaults.headers = {
      authorization: auth
    }
  }

  // Proxy
  const agent = getProxyAgent(defaults.baseUrl, options)
  if (agent) {
    defaults.request = {agent}
  }

  return graphql.defaults(defaults)
}

export function getAuthString(
  token: string,
  options: OctokitOptions
): string | undefined {
  if (!token && !options.auth) {
    throw new Error('Parameter token or opts.auth is required')
  } else if (token && options.auth) {
    throw new Error('Parameters token and opts.auth may not both be specified')
  }

  return typeof options.auth === 'string' ? options.auth : `token ${token}`
}

export function getProxyAgent(
  destinationUrl: string,
  options?: OctokitOptions
): http.Agent | undefined {
  if (!options || !options.request || !options.request.agent) {
    if (httpClient.getProxyUrl(destinationUrl)) {
      const hc = new httpClient.HttpClient()
      return hc.getAgent(destinationUrl)
    }
  } else if (options && options.request && options.request.agent) {
    return options.request.agent
  }
  return undefined
}

export function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}

export function getGraphQLBaseUrl(): string {
  let url =
    process.env['GITHUB_GRAPHQL_URL'] || 'https://api.github.com/graphql'

  // Shouldn't be a trailing slash, but remove if so
  if (url.endsWith('/')) {
    url = url.substr(0, url.length - 1)
  }

  // Remove trailing "/graphql"
  if (url.toUpperCase().endsWith('/GRAPHQL')) {
    url = url.substr(0, url.length - '/graphql'.length)
  }
  return url
}
