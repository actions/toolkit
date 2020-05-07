// we need this to setup our constructors, it is not exported by default
import {OctokitOptions} from '@octokit/core/dist-types/types'
import * as Context from './context'
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

// octokit + plugins
import { Octokit as Core } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods"
import { paginateRest } from "@octokit/plugin-paginate-rest"

export const context = new Context.Context()

const Octokit = Core.plugin(restEndpointMethods, paginateRest).defaults(
  {
    agent: getDefaultProxyAgent()
  })

export class GitHub extends Octokit {
  /* eslint-disable no-dupe-class-members */
  // Disable no-dupe-class-members due to false positive for method overload
  // https://github.com/typescript-eslint/typescript-eslint/issues/291

  /**
   * Sets up the REST client and GraphQL client with auth and proxy support.
   * The parameter `token` or `opts.auth` must be supplied. The GraphQL client
   * authorization is not setup when `opts.auth` is a function or object.
   *
   * @param token  Auth token
   * @param opts   Octokit options
   */
  constructor(token: string, opts?: Omit<OctokitOptions, 'auth'>)
  constructor(opts: OctokitOptions)
  constructor(token: string | OctokitOptions, opts?: OctokitOptions) {
    super(GitHub.getOctokitOptions(GitHub.disambiguate(token, opts)))
    this.graphql = GitHub.getGraphQL(GitHub.disambiguate(token, opts))
  }

  /**
   * Disambiguates the constructor overload parameters
   */
  private static disambiguate(
    token: string | OctokitOptions,
    opts?: OctokitOptions
  ): [string, OctokitOptions] {
    return [
      typeof token === 'string' ? token : '',
      typeof token === 'object' ? token : opts || {}
    ]
  }

  private static getOctokitOptions(
    args: [string, OctokitOptions]
  ): OctokitOptions {
    const token = args[0]
    const options = {...args[1]} // Shallow clone - don't mutate the object provided by the caller

    // Base URL - GHES or Dotcom
    options.baseUrl = options.baseUrl || this.getApiBaseUrl()

    // Auth
    const auth = GitHub.getAuthString(token, options)
    if (auth) {
      options.auth = auth
    }

    // Proxy
    const agent = GitHub.getProxyAgent(options.baseUrl, options)
    if (agent) {
      // Shallow clone - don't mutate the object provided by the caller
      options.request = options.request ? {...options.request} : {}

      // Set the agent
      options.request.agent = agent
    }

    return options
  }

  private static getGraphQL(args: [string, OctokitOptions]): GraphQL {
    const defaults: GraphQLRequestParameters = {}
    defaults.baseUrl = this.getGraphQLBaseUrl()
    const token = args[0]
    const options = args[1]

    // Authorization
    const auth = this.getAuthString(token, options)
    if (auth) {
      defaults.headers = {
        authorization: auth
      }
    }

    // Proxy
    const agent = GitHub.getProxyAgent(defaults.baseUrl, options)
    if (agent) {
      defaults.request = {agent}
    }

    return graphql.defaults(defaults)
  }

  private static getAuthString(
    token: string,
    options: OctokitOptions
  ): string | undefined {
    // Validate args
    if (!token && !options.auth) {
      throw new Error('Parameter token or opts.auth is required')
    } else if (token && options.auth) {
      throw new Error(
        'Parameters token and opts.auth may not both be specified'
      )
    }

    return typeof options.auth === 'string' ? options.auth : `token ${token}`
  }

  private static getProxyAgent(
    destinationUrl: string,
    options: OctokitOptions
  ): http.Agent | undefined {
    if (!options.request || !options.request.agent) {
      if (httpClient.getProxyUrl(destinationUrl)) {
        const hc = new httpClient.HttpClient()
        return hc.getAgent(destinationUrl)
      }
    }

    return undefined
  }

  private static getApiBaseUrl(): string {
    return process.env['GITHUB_API_URL'] || 'https://api.github.com'
  }

  private static getGraphQLBaseUrl(): string {
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
}

function getDefaultProxyAgent() : http.Agent | undefined
{
  const serverUrl = 'https://api.github.com'
  if (httpClient.getProxyUrl(serverUrl)) {
    const hc = new httpClient.HttpClient()
    return hc.getAgent(serverUrl)
  }
}
