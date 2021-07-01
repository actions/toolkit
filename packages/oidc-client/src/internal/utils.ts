
import {debug, info, warning} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IHeaders, IHttpClientResponse} from '@actions/http-client/interfaces'

import {
    getRuntimeToken,
    getWorkFlowRunId
  } from './config-variables'

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
    return '1.0'
  }

