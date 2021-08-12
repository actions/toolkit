import * as actions_http_client from '@actions/http-client'
import {IRequestOptions} from '@actions/http-client/interfaces'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {debug, setSecret} from './core'

interface IOidcClient {

  createHttpClient(): actions_http_client.HttpClient

  getApiVersion(): string

  getRuntimeToken(): string

  getIDTokenUrl(): string

  postCall(httpclient: actions_http_client.HttpClient, id_token_url: string, audience: string): Promise<string>

  getIDToken(audience: string): Promise<string>
}

export class OidcClient implements IOidcClient {

  createHttpClient(allowRetry = true, maxRetry = 10) {
    let requestOptions : IRequestOptions = {}
    requestOptions.allowRetries = allowRetry
    requestOptions.maxRetries = maxRetry
    return new HttpClient('actions/oidc-client', [
      new BearerCredentialHandler(this.getRuntimeToken())],
      requestOptions)
  }

  getApiVersion(): string {
    return '2.0'
  }

  getRuntimeToken(){
    const token = process.env['ACTIONS_RUNTIME_TOKEN']
    if (!token) {
      throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
    }
    return token
  }

  getIDTokenUrl(){
    let runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
    if (!runtimeUrl) {
      throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
    }
    return runtimeUrl + '?api-version=' + this.getApiVersion()
  }

  async postCall(httpclient: actions_http_client.HttpClient, id_token_url: string, audience: string): Promise<string> {
    const data = audience !== null ? {aud: audience} : ''

    debug(`audience is ${audience !== null ? audience : 'null'}`)

    const res = await httpclient.postJson(id_token_url,data).catch((error) => {
      throw new Error(
        `Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`
      )
    })

    let val :any = res.result
    let id_token = val['value']
    if (id_token === undefined) {
      throw new Error('Response json body do not have ID Token field')
    }
    return id_token

  }

  async getIDToken(audience: string): Promise<string> {
    try {
      const httpclient = this.createHttpClient()
      if (httpclient === undefined) {
        throw new Error(`Failed to get Httpclient `)
      }

      // New ID Token is requested from action service
      let id_token_url: string = this.getIDTokenUrl()

      debug(`ID token url is ${id_token_url}`)

      let id_token = await this.postCall(httpclient ,id_token_url, audience)
      setSecret(id_token)
      return id_token
    } catch (error) {
      throw new Error(`Error message: ${error.message}`)
    }
  }
}