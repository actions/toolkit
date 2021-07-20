import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {getRuntimeToken} from './config-variables'

export function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

export function createHttpClient(): HttpClient {
  return new HttpClient('actions/oidc-client', [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

export function getApiVersion(): string {
  return '2.0'
}
