// Originally pulled from https://github.com/JasonEtco/actions-toolkit/blob/master/src/github.ts
import {graphql} from '@octokit/graphql'

// we need this type to set up a property on the GitHub object
// that has token authorization
// (it is not exported from octokit by default)
import {graphql as GraphQL} from '@octokit/graphql/dist-types/types'

import Octokit from '@octokit/rest'
import * as Context from './context'

// We need this in order to extend Octokit
Octokit.prototype = new Octokit()

export const context = new Context.Context()

export class GitHub extends Octokit {
  graphql: GraphQL

  constructor(token: string, opts: Omit<Octokit.Options, 'auth'> = {}) {
    super({...opts, auth: `token ${token}`})

    this.graphql = graphql.defaults({
      headers: {authorization: `token ${token}`}
    })
  }
}
