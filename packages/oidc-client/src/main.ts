import * as core from '@actions/core'
import * as actions_http_client from '@actions/http-client'
import {IHeaders} from '@actions/http-client/interfaces'
import {createHttpClient, isSuccessStatusCode} from './internal/utils'
import {getIDTokenUrl} from './internal/config-variables'

async function postCall(
  id_token_url: string,
  audience: string
): Promise<string> {
  const httpclient = createHttpClient()
  if (httpclient === undefined) {
    throw new Error(`Failed to get Httpclient `)
  }

  core.debug(`Httpclient created ${httpclient} `) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

  const additionalHeaders: IHeaders = {}
  additionalHeaders[actions_http_client.Headers.ContentType] =
    actions_http_client.MediaTypes.ApplicationJson
  additionalHeaders[actions_http_client.Headers.Accept] =
    actions_http_client.MediaTypes.ApplicationJson

  core.debug(`audience is ${audience !== null ? audience : 'null'}`)

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

function parseJson(body: string): string {
  const val = JSON.parse(body)
  let id_token = ''
  if ('value' in val) {
    id_token = val['value']
  } else {
    throw new Error('Response json body do not have ID Token field')
  }
  core.debug(`id_token : ${id_token}`)
  return id_token
}

export async function getIDToken(audience: string): Promise<string> {
  try {
    // New ID Token is requested from action service
    let id_token_url: string = getIDTokenUrl()

    core.debug(`ID token url is ${id_token_url}`)

    let body: string = await postCall(id_token_url, audience)

    let id_token = parseJson(body)

    return id_token
  } catch (error) {
    core.setFailed(error.message)
    return error.message
  }
}
