import * as http from 'http'
import * as httpClient from '@actions/http-client'
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

export function getProxyAgent(destinationUrl: string): http.Agent | undefined {
  const hc = new httpClient.HttpClient()
  return hc.getAgent(destinationUrl)
}

export function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}
