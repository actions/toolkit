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
 * Convience function to correctly format options from a token
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOptions(
  token: string,
  options?: OctokitOptions
): OctokitOptions {
  return Utils.getOctokitOptions(Utils.disambiguate(token, options))
}
