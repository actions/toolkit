import * as Context from './context'
import {GitHub, getOctokitOptions} from './utils'

// octokit + plugins
import {OctokitOptions} from '@octokit/core/dist-types/types'

export const context = new Context.Context()

/**
 * Returns a hydrated octokit ready to use for GitHub Actions
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOctokit(
  token: string,
  options?: OctokitOptions
): InstanceType<typeof GitHub> {
  return new GitHub(getOctokitOptions(token, options))
}
