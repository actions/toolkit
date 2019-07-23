/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PayloadRepository {
  [key: string]: any
  fullName?: string
  name: string
  owner: {
    [key: string]: any
    login: string
    name?: string
  }
  htmlUrl?: string
}

export interface WebhookPayloadWithRepository {
  [key: string]: any
  repository?: PayloadRepository
  issue?: {
    [key: string]: any
    number: number
    html_url?: string
    body?: string
  }
  pullRequest?: {
    [key: string]: any
    number: number
    htmlUrl?: string
    body?: string
  }
  sender?: {
    [key: string]: any
    type: string
  }
  action?: string
  installation?: {
    id: number
    [key: string]: any
  }
}
