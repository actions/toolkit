import * as http from 'http'
import * as httpClient from '@actions/http-client'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {ProxyAgent, fetch as undiciFetch} from 'undici'

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

export function getProxyFetch(destinationUrl): any {
  const httpDispatcher = getProxyAgentDispatcher(destinationUrl)
  const proxyFetch: typeof undiciFetch = (url, opts) => {
    return undiciFetch(url, {
      ...opts,
      dispatcher: httpDispatcher
    })
  }
  return proxyFetch
}

export function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}
