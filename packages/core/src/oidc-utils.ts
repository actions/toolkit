import * as actions_http_client from '@actions/http-client'
import {IHeaders} from '@actions/http-client/interfaces'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {debug} from './core'


export function createHttpClient() {
  return new HttpClient('actions/oidc-client', [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

export function getApiVersion(): string {
  return '2.0'
}

export function getRuntimeToken(){
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getIDTokenUrl(){
  let runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
  if (!runtimeUrl) {
    throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
  }
  return runtimeUrl + '?api-version=' + getApiVersion()
}

export function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

export async function postCall(id_token_url: string, audience: string): Promise<string> {

  const httpclient = createHttpClient()
  if (httpclient === undefined) {
    throw new Error(`Failed to get Httpclient `)
  }

  debug(`Httpclient created ${httpclient} `) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

  const additionalHeaders: IHeaders = {}
  additionalHeaders[actions_http_client.Headers.ContentType] = actions_http_client.MediaTypes.ApplicationJson
  additionalHeaders[actions_http_client.Headers.Accept] = actions_http_client.MediaTypes.ApplicationJson

  debug(`audience is ${audience !== null ? audience : 'null'}`)

  const data: string = audience !== null ? JSON.stringify({aud: audience}) : ''
  const response = await httpclient.post(id_token_url, data, additionalHeaders)

  if (!isSuccessStatusCode(response.message.statusCode)) {
    throw new Error(
      `Failed to get ID Token. Error Code : ${response.message.statusCode}  Error message : ${response.message.statusMessage}`
    )
  }
  let body: string = await response.readBody()

  return body
}

export function parseJson(body: string): string {
  const val = JSON.parse(body)
  let id_token = ''
  if ('value' in val) {
    id_token = val['value']
  } else {
    throw new Error('Response json body do not have ID Token field')
  }
  debug(`id_token : ${id_token}`)
  return id_token
}