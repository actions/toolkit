import * as core from '@actions/core'
import * as actions_http_client from '@actions/http-client'
import {
  createHttpClient,
  isSuccessStatusCode,
  getApiVersion
} from './internal/utils'
import jwt_decode from 'jwt-decode'
import {getIDTokenFromEnv, getIDTokenUrl} from './internal/config-variables'

export async function getIDToken(audience: string): Promise<string> {
  try {
    //Check if id token is stored in environment variable

    let id_token: string = getIDTokenFromEnv()
    if (id_token !== undefined) {
      const secondsSinceEpoch = Math.round(Date.now() / 1000)
      const id_token_json: any = jwt_decode(id_token)
      if ('exp' in id_token_json) {
        if (id_token_json['exp'] - secondsSinceEpoch > 300) {
          // Expiry time is more than 5 mins
          return id_token
        }
      } else {
        throw new Error('Expiry time not defined in ID Token')
      }
    }

    // New ID Token is requested from action service

    let id_token_url: string = getIDTokenUrl()

    if (id_token_url === undefined) {
      throw new Error(`ID Token URL not found`)
    }
    id_token_url = id_token_url + '?api-version=' + getApiVersion()
    core.debug(`ID token url is ${id_token_url}`)

    const httpclient = createHttpClient()
    if (httpclient === undefined) {
      throw new Error(`Failed to get Httpclient `)
    }
    core.debug(`Httpclient created ${httpclient} `) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    const additionalHeaders = {
      [actions_http_client.Headers.ContentType]:
        actions_http_client.MediaTypes.ApplicationJson
    }

    const data: string = JSON.stringify({aud: audience})
    const response = await httpclient.post(
      id_token_url,
      data,
      additionalHeaders
    )

    if (!isSuccessStatusCode(response.message.statusCode)) {
      throw new Error(
        `Failed to get ID Token. Error message  :${response.message.statusMessage} `
      )
    }

    const body: string = await response.readBody()
    const val = JSON.parse(body)
    id_token = val['value']

    if (id_token === undefined) {
      throw new Error(`Not able to fetch the ID token`)
    }

    // Save ID Token in Env Variable
    core.exportVariable('OIDC_TOKEN_ID', id_token)

    return id_token
  } catch (error) {
    core.setFailed(error.message)
    return error.message
  }
}

//module.exports.getIDToken = getIDToken

//getIDToken('ghactions')
