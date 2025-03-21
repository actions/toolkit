import * as http from 'http'
import * as httpClient from '@actions/http-client'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {ProxyAgent, fetch} from 'undici'
import * as Context from '../../context'

// octokit + plugins
import {Octokit} from '@octokit/core'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {paginateRest} from '@octokit/plugin-paginate-rest'
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

export function getProxyAgent(destinationUrl: string): http.Agent {
  const hc = new httpClient.HttpClient()
  return hc.getAgent(destinationUrl)
}

export function getProxyAgentDispatcher(
  destinationUrl: string
): ProxyAgent | undefined {
  const hc = new httpClient.HttpClient()
  return hc.getAgentDispatcher(destinationUrl)
}

export function getProxyFetch(destinationUrl): typeof fetch {
  const httpDispatcher = getProxyAgentDispatcher(destinationUrl)
  const proxyFetch: typeof fetch = async (url, opts) => {
    return fetch(url, {
      ...opts,
      dispatcher: httpDispatcher
    })
  }
  return proxyFetch
}

export function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}


export const context = new Context.Context()

const baseUrl = getApiBaseUrl()
export const defaults: OctokitOptions = {
  baseUrl,
  request: {
    agent: getProxyAgent(baseUrl),
    fetch: getProxyFetch(baseUrl)
  }
}

export const GitHub = Octokit.plugin(
  restEndpointMethods,
  paginateRest
).defaults(defaults)

/**
 * Convience function to correctly format Octokit Options to pass into the constructor.
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOctokitOptions(
  token: string,
  options?: OctokitOptions
): OctokitOptions {
  const opts = Object.assign({}, options || {}) // Shallow clone - don't mutate the object provided by the caller

  // Auth
  const auth = getAuthString(token, opts)
  if (auth) {
    opts.auth = auth
  }

  return opts
}

