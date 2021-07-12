import * as core from '@actions/core'
import {IHeaders} from '@actions/http-client/interfaces'
import {
  createHttpClient,
  isSuccessStatusCode
} from './internal/utils'

import {
  getIDTokenFromEnv,
  getIDTokenUrl
} from './internal/config-variables'


export async function getIDToken(audience: string): Promise<string> {
  try {

    //Check if id token is stored in environment variable

    var id_token: string = getIDTokenFromEnv()
    if(id_token != undefined) {
      const secondsSinceEpoch = Math.round(Date.now() / 1000)
      const id_token_json = JSON.parse(id_token)
      if(parseInt(id_token_json['exp']) - secondsSinceEpoch > 120)    // Expiry time is more than 2 mins
        return id_token
    }


    // New ID Token is requested from action service
    
    const id_tokne_url: string =  getIDTokenUrl()

    if (id_tokne_url == undefined) {
      throw new Error(`ID Token URL not found`)
    }

    core.debug(`ID token url is ${id_tokne_url}`)

    const httpclient = createHttpClient()
    if (httpclient == undefined) {
      throw new Error(`Failed to get Httpclient `)
    }
    core.debug(`Httpclient created ${httpclient} `) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    var additionalHeaders = {[httpclient.Headers.ContentType]: httpclient.MediaTypes.ApplicationJson}

    var data : String = new String('id_token_aud:')
    data = data.concat(audience)
    const response = await httpclient.post(id_tokne_url, data, additionalHeaders)

    
    if (!isSuccessStatusCode(response.message.statusCode)){
      throw new Error(
        `Failed to get ID Token. Error message  :${response.message.statusMessage} `
      )
    }

    const body: string = await response.readBody()
    const val = JSON.parse(body)
    id_token = val['value']

    if (id_token == undefined) {
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

module.exports.getIDToken = getIDToken
