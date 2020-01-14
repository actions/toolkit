import Webhooks from '@octokit/webhooks'
export type WebhookPayload =
  | Webhooks.WebhookPayloadPush
  | Webhooks.WebhookPayloadPullRequest
  | Webhooks.WebhookPayloadPullRequestReview
  | Webhooks.WebhookPayloadPullRequestReviewComment
  | Webhooks.WebhookPayloadStatus
  | Webhooks.WebhookPayloadIssues
  | Webhooks.WebhookPayloadIssueComment
  | Webhooks.WebhookPayloadRelease
  | Webhooks.WebhookPayloadRepositoryDispatch
  | Webhooks.WebhookPayloadCheckRun
  | Webhooks.WebhookPayloadDeployment
  | Webhooks.WebhookPayloadCheckSuite
  | Webhooks.WebhookPayloadWatch
  | Webhooks.WebhookPayloadDeploymentStatus
  | Webhooks.WebhookPayloadCreate
  | Webhooks.WebhookPayloadDelete
  | Webhooks.WebhookPayloadProjectCard
  | Webhooks.WebhookPayloadPageBuild
  | Webhooks.WebhookPayloadFork
  | Webhooks.WebhookPayloadGollum
  | Webhooks.WebhookPayloadMilestone
  | Webhooks.WebhookPayloadProject
  | Webhooks.WebhookPayloadLabel
