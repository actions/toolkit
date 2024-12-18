import * as Context from './context'
import {GitHub, getOctokitOptions} from './utils'

// octokit + plugins
import {OctokitOptions, OctokitPlugin} from '@octokit/core/dist-types/types'
export {RequestError} from '@octokit/request-error';

export const context = new Context.Context()

/**
 * Returns a hydrated octokit ready to use for GitHub Actions
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
export function getOctokit(
  token: string,
  options?: OctokitOptions,
  ...additionalPlugins: OctokitPlugin[]
): InstanceType<typeof GitHub> {
  const GitHubWithPlugins = GitHub.plugin(...additionalPlugins)
  return new GitHubWithPlugins(getOctokitOptions(token, options))
}
