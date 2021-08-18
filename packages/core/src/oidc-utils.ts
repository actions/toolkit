import * as actions_http_client from '@actions/http-client'
import {IRequestOptions} from '@actions/http-client/interfaces'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {debug, setSecret} from './core'

interface TokenRequest {
  aud: string | undefined
}

interface TokenResponse {
  value: string | undefined
}

export class OidcClient {

  private static createHttpClient(allowRetry = true, maxRetry = 10) {
    let requestOptions: IRequestOptions = {
      allowRetries: allowRetry,
      maxRetries: maxRetry
    }
    
    return new HttpClient('actions/oidc-client', [
      new BearerCredentialHandler(OidcClient.getRuntimeToken())],
      requestOptions)
  }

  private static getApiVersion(): string {
    return '2.0'
  }

  private static getRuntimeToken(){
    const token = process.env['ACTIONS_RUNTIME_TOKEN']
    if (!token) {
      throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
    }
    return token
  }

  private static getIDTokenUrl(){
    let runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
    if (!runtimeUrl) {
      throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
    }
    return runtimeUrl + '?api-version=' + OidcClient.getApiVersion()
  }

  private static async postCall(httpclient: actions_http_client.HttpClient, id_token_url: string, data: TokenRequest): Promise<string> {
    const res = await httpclient.postJson<TokenResponse>(id_token_url,data).catch((error) => {
      throw new Error(
        `Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`
      )
    })

    const id_token = res.result?.value
    if (id_token === undefined) {
      throw new Error('Response json body do not have ID Token field')
    }
    return id_token

  }

  static async getIDToken(audience: string | undefined): Promise<string> {
    try {
      const httpclient = OidcClient.createHttpClient()

      // New ID Token is requested from action service
      const id_token_url: string = OidcClient.getIDTokenUrl()

      debug(`ID token url is ${id_token_url}`)

      const data: TokenRequest = { aud: audience }

      debug(`audience is ${!!audience ? audience : 'not defined'}`)

      const id_token = await OidcClient.postCall(httpclient ,id_token_url, data)
      setSecret(id_token)
      return id_token
    } catch (error) {
      throw new Error(`Error message: ${error.message}`)
    }
  }
}