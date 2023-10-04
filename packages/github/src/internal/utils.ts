import * as http from 'http'
import * as httpClient from '@actions/http-client'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import { ProxyServer, createProxy } from "proxy";
import { ProxyAgent, Agent, fetch as undiciFetch } from "undici";

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

export function getNewProxyAgent(destinationUrl: string): ProxyAgent | Agent {
  const hc = new httpClient.HttpClient()
  return hc.getNewAgent(destinationUrl)
}

export function getProxyFetchAgent(destinationUrl): any {
  const httpAgent = getNewProxyAgent(destinationUrl)
  const myFetch: typeof undiciFetch = (url, opts) => {
    return undiciFetch(url, {
      ...opts,
      dispatcher: httpAgent,
    });
  };
  return myFetch;
}

export function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}
