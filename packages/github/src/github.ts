import * as Context from './context'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import * as Utils from './internal/utils'

// octokit + plugins
import {Octokit as Core} from '@octokit/core'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {paginateRest} from '@octokit/plugin-paginate-rest'
import {enterpriseServer220Admin} from '@octokit/plugin-enterprise-server'

export const context = new Context.Context()
const OctokitEnterprise = Core.plugin(paginateRest, enterpriseServer220Admin)
const Octokit = Core.plugin(paginateRest, restEndpointMethods)
export class GitHub extends Octokit {
  /* eslint-disable no-dupe-class-members */
  // Disable no-dupe-class-members due to false positive for method overload
  // https://github.com/typescript-eslint/typescript-eslint/issues/291

  /**
   * Sets up the REST client and GraphQL client with auth and proxy support.
   * The parameter `token` or `opts.auth` must be supplied. The GraphQL client
   * authorization is not setup when `opts.auth` is a function or object.
   *
   * @param token  Auth token
   * @param opts   Octokit options
   */
  constructor(token: string, opts?: Omit<OctokitOptions, 'auth'>)
  constructor(opts: OctokitOptions)
  constructor(token: string | OctokitOptions, opts?: OctokitOptions) {
    super(Utils.getOctokitOptions(Utils.disambiguate(token, opts)))
    this.graphql = Utils.getGraphQL(Utils.disambiguate(token, opts))
  }
}

export class GitHubEnterprise extends OctokitEnterprise {
  /**
   * Sets up the REST client and GraphQL client with auth and proxy support.
   * The parameter `token` or `opts.auth` must be supplied. The GraphQL client
   * authorization is not setup when `opts.auth` is a function or object.
   *
   * @param token  Auth token
   * @param opts   Octokit options
   * @param version the version of the GitHubEnterprise
   */
  constructor(token: string, opts?: Omit<OctokitOptions, 'auth'>)
  constructor(opts: OctokitOptions)
  constructor(token: string | OctokitOptions, opts?: OctokitOptions) {
    super(Utils.getOctokitOptions(Utils.disambiguate(token, opts)))
    this.graphql = Utils.getGraphQL(Utils.disambiguate(token, opts))
  }
}
