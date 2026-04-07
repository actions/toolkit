import * as http from 'http'
import * as httpClient from '@actions/http-client'
import type {OctokitOptions} from '@octokit/core/types'
import {ProxyAgent, fetch} from 'undici'

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

export function getUserAgentWithOrchestrationId(
  baseUserAgent?: string
): string | undefined {
  const orchId = process.env['ACTIONS_ORCHESTRATION_ID']?.trim()
  if (orchId) {
    const sanitizedId = orchId.replace(/[^a-z0-9_.-]/gi, '_')
    const ua = baseUserAgent ? `${baseUserAgent} ` : ''
    return `${ua}actions_orchestration_id/${sanitizedId}`
  }
  return baseUserAgent
}
