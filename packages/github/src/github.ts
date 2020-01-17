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
import * as url from 'url'
import {HttpClient} from '@actions/http-client'

// We need this in order to extend Octokit
Octokit.prototype = new Octokit()

export const context = new Context.Context()

export class GitHub extends Octokit {
  graphql: GraphQL

  /* eslint-disable no-dupe-class-members */
  // Disable no-dupe-class-members due to false positive for method overload
  // https://github.com/typescript-eslint/typescript-eslint/issues/291

  constructor(token: string, opts?: Octokit.Options)
  constructor(opts: Octokit.Options)
  constructor(token: string | Octokit.Options, opts?: Octokit.Options) {
    super(
      GitHub.getOctokitOptions(
        typeof token === 'string' ? token : '',
        typeof token === 'object' ? (token as Octokit.Options) : opts || {}
      )
    )

    this.graphql = GitHub.getGraphQL(typeof token === 'string' ? token : '')
  }

  /* eslint-disable @typescript-eslint/promise-function-async */
  private static getOctokitOptions(
    token: string,
    opts: Octokit.Options
  ): Octokit.Options {
    // Shallow clone the options - don't mutate the object provided by the caller
    opts = {...opts}

    // Validate args
    if (!token && !opts.auth) {
      throw new Error('Parameter token or opts.auth is required')
    } else if (token && opts.auth) {
      throw new Error('Parameter token and opts.auth may not both be specified')
    }

    // Token
    if (token) {
      opts.auth = `token ${token}`
    }

    // Proxy
    if (!opts.request || !opts.request.agent) {
      const agent = GitHub.getProxyAgent()
      if (agent) {
        // Shallow clone the request object - don't mutate the object provided by the caller
        opts.request = opts.request ? {...opts.request} : {}

        // Set the agent
        opts.request.agent = agent
      }
    }

    return opts
  }

  private static getGraphQL(token: string): GraphQL {
    const defaults: GraphQLRequestParameters = {}

    // Token
    if (token) {
      defaults.headers = {
        authorization: `token ${token}`
      }
    }

    // Proxy
    if (!defaults.request || !defaults.request.agent) {
      const agent = GitHub.getProxyAgent()
      if (agent) {
        defaults.request = {agent}
      }
    }

    return graphql.defaults(defaults)
  }

  private static getProxyAgent(): http.Agent | null {
    const proxyUrl = process.env['https_proxy']
    if (proxyUrl) {
      const httpClient = new HttpClient()
      const apiUrl = url.parse('https://api.github.com')
      const getAgent = ((httpClient as unknown) as {[key: string]: Function})[
        '_getAgent'
      ]
      return getAgent.call(httpClient, apiUrl) as http.Agent
    }

    return null
  }
}
