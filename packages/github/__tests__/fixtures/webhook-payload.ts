import type {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'
import type {WebhookPayload} from '../../src/interfaces.js'

declare const pullRequest: RestEndpointMethodTypes['pulls']['get']['response']['data']
declare const issue: RestEndpointMethodTypes['issues']['get']['response']['data']

export const payloads: WebhookPayload[] = [
  {pull_request: pullRequest},
  {issue},
  {pull_request: {number: 1, body: null}},
  {issue: {number: 1, body: null}},
  {pull_request: {number: 1, body: 'A description'}},
  {issue: {number: 1, body: 'A description'}},
  {pull_request: {number: 1}},
  {issue: {number: 1}}
]
