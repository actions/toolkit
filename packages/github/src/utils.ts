import * as Context from './context'
import * as Utils from './internal/utils'

// octokit + plugins
import {Octokit} from '@octokit/core'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {paginateRest} from '@octokit/plugin-paginate-rest'

export const context = new Context.Context()

const baseUrl = Utils.getApiBaseUrl()
const defaults = {
  baseUrl,
  request: {
    agent: Utils.getProxyAgent(baseUrl)
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
  const auth = Utils.getAuthString(token, opts)
  if (auth) {
    opts.auth = auth
  }

  return opts
}
