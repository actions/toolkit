// Originally pulled from https://github.com/JasonEtco/actions-toolkit/blob/master/src/context.ts
import {WebhookPayload, Webhooks} from './interfaces'
import {readFileSync, existsSync} from 'fs'
import {EOL} from 'os'

export class Context {
  /**
   * Webhook payload object that triggered the workflow
   */
  payload: WebhookPayload

  eventName: string
  sha: string
  ref: string
  workflow: string
  action: string
  actor: string

  /**
   * Hydrate the context from the environment
   */
  constructor() {
    this.payload = {}
    if (process.env.GITHUB_EVENT_PATH) {
      if (existsSync(process.env.GITHUB_EVENT_PATH)) {
        this.payload = JSON.parse(
          readFileSync(process.env.GITHUB_EVENT_PATH, {encoding: 'utf8'})
        )
      } else {
        const path = process.env.GITHUB_EVENT_PATH
        process.stdout.write(`GITHUB_EVENT_PATH ${path} does not exist${EOL}`)
      }
    }
    this.eventName = process.env.GITHUB_EVENT_NAME as string
    this.sha = process.env.GITHUB_SHA as string
    this.ref = process.env.GITHUB_REF as string
    this.workflow = process.env.GITHUB_WORKFLOW as string
    this.action = process.env.GITHUB_ACTION as string
    this.actor = process.env.GITHUB_ACTOR as string
  }

  get issue(): {owner: string; repo: string; number: number} {
    const payload = this.payload
    return {
      ...this.repo,
      number: (payload.issue || payload.pull_request || payload).number
    }
  }

  get repo(): {owner: string; repo: string} {
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
      return {owner, repo}
    }

    if (this.payload.repository) {
      return {
        owner: this.payload.repository.owner.login,
        repo: this.payload.repository.name
      }
    }

    throw new Error(
      "context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
    )
  }
}
