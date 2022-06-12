/* eslint-disable @typescript-eslint/no-extraneous-class */
import * as actions_http_client from '@actions/http-client'
import {RequestOptions} from '@actions/http-client/lib/interfaces'
import {HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {debug, setSecret} from './core'
interface TokenResponse {
  value?: string
}

export class OidcClient {
  private static createHttpClient(
    allowRetry = true,
    maxRetry = 10
  ): actions_http_client.HttpClient {
    const requestOptions: RequestOptions = {
      allowRetries: allowRetry,
      maxRetries: maxRetry
    }

    return new HttpClient(
      'actions/oidc-client',
      [new BearerCredentialHandler(OidcClient.getRequestToken())],
      requestOptions
    )
  }

  private static getRequestToken(): string {
    const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN']
    if (!token) {
      throw new Error(
        'Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable'
      )
    }
    return token
  }

  private static getIDTokenUrl(): string {
    const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
    if (!runtimeUrl) {
      throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
    }
    return runtimeUrl
  }

  private static async getCall(id_token_url: string): Promise<string> {
    const httpclient = OidcClient.createHttpClient()

    const res = await httpclient
      .getJson<TokenResponse>(id_token_url)
      .catch(error => {
        throw new Error(
          `Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`
        )
      })

    const id_token = res.result?.value
    if (!id_token) {
      throw new Error('Response json body do not have ID Token field')
    }
    return id_token
  }

  static async getIDToken(audience?: string): Promise<string> {
    try {
      // New ID Token is requested from action service
      let id_token_url: string = OidcClient.getIDTokenUrl()
      if (audience) {
        const encodedAudience = encodeURIComponent(audience)
        id_token_url = `${id_token_url}&audience=${encodedAudience}`
      }

      debug(`ID token url is ${id_token_url}`)

      const id_token = await OidcClient.getCall(id_token_url)
      setSecret(id_token)
      return id_token
    } catch (error) {
      throw new Error(`Error message: ${error.message}`)
    }
  }
}
