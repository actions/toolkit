/* eslint-disable @typescript-eslint/no-explicit-any */
import Webhooks from '@octokit/webhooks'

export interface WebhookPayload {
  [key: string]: any
  repository?: Webhooks.PayloadRepository
  issue?: Webhooks.WebhookPayloadIssuesIssue
  pull_request?: Webhooks.WebhookPayloadPullRequest['pull_request']
  sender?: {
    [key: string]: any
    type: string
  }
  action?: string
  installation?: Webhooks.WebhookPayloadInstallationInstallation
}
