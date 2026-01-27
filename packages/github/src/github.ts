import * as Context from './context.js'
import {GitHub, getOctokitOptions} from './utils.js'
// octokit + plugins
import type {OctokitOptions, OctokitPlugin} from '@octokit/core/types'

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
