// Originally pulled from https://github.com/JasonEtco/actions-toolkit/blob/master/src/github.ts
import {graphql} from '@octokit/graphql'

// we need this type to set up a property on the GitHub object
// that has token authorization
// (it is not exported from octokit by default)
import {
  graphql as GraphQL,
  RequestParameters as GraphQLRequestParameters
} from '@octokit/graphql/dist-types/types'

import Octokit from '@octokit/rest'
import * as Context from './context'
import * as http from 'http'
import {HttpClient} from '@actions/http-client'

// We need this in order to extend Octokit
Octokit.prototype = new Octokit()

export const context = new Context.Context()

export class GitHub extends Octokit {
  graphql: GraphQL

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
  constructor(token: string, opts?: Omit<Octokit.Options, 'auth'>)
  constructor(opts: Octokit.Options)
  constructor(token: string | Octokit.Options, opts?: Octokit.Options) {
    super(GitHub.getOctokitOptions(GitHub.disambiguate(token, opts)))

    this.graphql = GitHub.getGraphQL(GitHub.disambiguate(token, opts))
  }

  /**
   * Disambiguates the constructor overload parameters
   */
  private static disambiguate(
    token: string | Octokit.Options,
    opts?: Octokit.Options
  ): [string, Octokit.Options] {
    return [
      typeof token === 'string' ? token : '',
      typeof token === 'object' ? token : opts || {}
    ]
  }

  private static getOctokitOptions(
    args: [string, Octokit.Options]
  ): Octokit.Options {
    const token = args[0]
    const options = {...args[1]} // Shallow clone - don't mutate the object provided by the caller

    // Auth
    const auth = GitHub.getAuthString(token, options)
    if (auth) {
      options.auth = auth
    }

    // Proxy
    const agent = GitHub.getProxyAgent(options)
    if (agent) {
      // Shallow clone - don't mutate the object provided by the caller
      options.request = options.request ? {...options.request} : {}

      // Set the agent
      options.request.agent = agent
    }

    return options
  }

  private static getGraphQL(args: [string, Octokit.Options]): GraphQL {
    const defaults: GraphQLRequestParameters = {}
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
    const agent = GitHub.getProxyAgent(options)
    if (agent) {
      defaults.request = {agent}
    }

    return graphql.defaults(defaults)
  }

  private static getAuthString(
    token: string,
    options: Octokit.Options
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
    options: Octokit.Options
  ): http.Agent | undefined {
    if (!options.request?.agent) {
      const proxyUrl = process.env['https_proxy'] || process.env['HTTPS_PROXY']
      if (proxyUrl) {
        const httpClient = new HttpClient()
        return httpClient.getAgent('https://api.github.com')
      }
    }

    return undefined
  }
}
