import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {getRuntimeToken} from './config-variables'

function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

function createHttpClient(): HttpClient {
  return new HttpClient('actions/oidc-client', [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

function getApiVersion(): string {
  return '2.0'
}

export {isSuccessStatusCode,createHttpClient,getApiVersion}