import * as actions_http_client from '@actions/http-client'
import {IHeaders,IRequestOptions} from '@actions/http-client/interfaces'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {debug} from './core'

interface IOidcClient {

  createHttpClient(): actions_http_client.HttpClient

  getApiVersion(): string

  getRuntimeToken(): string

  getIDTokenUrl(): string

  isSuccessStatusCode(statusCode?: number): boolean

  postCall(id_token_url: string, audience: string): Promise<string>

  parseJson(body: string): string

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

  isSuccessStatusCode(statusCode?: number): boolean {
    if (!statusCode) {
      return false
    }
    return statusCode >= 200 && statusCode < 300
  }

  async postCall(id_token_url: string, audience: string): Promise<string> {

    const httpclient = this.createHttpClient()
    if (httpclient === undefined) {
      throw new Error(`Failed to get Httpclient `)
    }

    let additionalHeaders: IHeaders = {}
    additionalHeaders[actions_http_client.Headers.ContentType] = actions_http_client.MediaTypes.ApplicationJson
    additionalHeaders[actions_http_client.Headers.Accept] = actions_http_client.MediaTypes.ApplicationJson

    debug(`audience is ${audience !== null ? audience : 'null'}`)

    const data: string = audience !== null ? JSON.stringify({aud: audience}) : ''
    const response = await httpclient.post(id_token_url, data, additionalHeaders)
    const body: string = await response.readBody()

    if (!this.isSuccessStatusCode(response.message.statusCode)) {
      throw new Error(
        `Failed to get ID Token. \n Error Code : ${response.message.statusCode}  Error message : ${response.message.statusMessage} \n Response body: ${body}`
      )
    }

    return body
  }

  parseJson(body: string): string {
    const val = JSON.parse(body)
    let id_token = ''
    if ('value' in val) {
      id_token = val['value']
    } else {
      throw new Error('Response json body do not have ID Token field')
    }
    return id_token
  }

  async getIDToken(audience: string): Promise<string> {
    try {
      // New ID Token is requested from action service
      let id_token_url: string = this.getIDTokenUrl()

      debug(`ID token url is ${id_token_url}`)

      let body: string = await this.postCall(id_token_url, audience)
      let id_token = this.parseJson(body)
      return id_token

    } catch (error) {
      throw new Error(`Error message: ${error.message}`)
    }
  }

}