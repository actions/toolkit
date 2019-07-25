// Originally pulled from https://github.com/JasonEtco/actions-toolkit/blob/master/src/github.ts
import {GraphQlQueryResponse, Variables, defaults} from '@octokit/graphql'
import Octokit from '@octokit/rest'
import * as Context from './context'

// We need this in order to extend Octokit
Octokit.prototype = new Octokit()

module.exports.context = new Context.Context()

export class GitHub extends Octokit {
  graphql: (
    query: string,
    variables?: Variables
  ) => Promise<GraphQlQueryResponse>

  constructor(token: string) {
    super({auth: `token ${token}`})
    this.graphql = defaults({
      headers: {authorization: `token ${token}`}
    })
  }
}
