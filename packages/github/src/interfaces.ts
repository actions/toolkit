/* eslint-disable @typescript-eslint/no-explicit-any */
import Webhooks from '@octokit/webhooks'

export interface WebhookPayload {
  [key: string]: any
  repository?: Webhooks.PayloadRepository
  issue?: Webhooks.WebhookPayloadIssuesIssue
  pull_request?: Webhooks.WebhookPayloadPullRequest
  sender?: {
    [key: string]: any
    type: string
  }
  action: number
  installation?: Webhooks.WebhookPayloadInstallationInstallation
}
