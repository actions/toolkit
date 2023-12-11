import {HttpClient, HttpClientResponse, HttpCodes} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {info, debug} from '@actions/core'
import {ArtifactServiceClientJSON} from '../../generated'
import {getResultsServiceUrl, getRuntimeToken} from './config'
import {getUserAgentString} from './user-agent'

// The twirp http client must implement this interface
interface Rpc {
  request(
    service: string,
    method: string,
    contentType: 'application/json' | 'application/protobuf',
    data: object | Uint8Array
  ): Promise<object | Uint8Array>
}

class ArtifactHttpClient implements Rpc {
  private httpClient: HttpClient
  private baseUrl: string
  private maxAttempts = 5
  private baseRetryIntervalMilliseconds = 3000
  private retryMultiplier = 1.5

  constructor(
    userAgent: string,
    maxAttempts?: number,
    baseRetryIntervalMilliseconds?: number,
    retryMultiplier?: number
  ) {
    const token = getRuntimeToken()
    this.baseUrl = getResultsServiceUrl()
    if (maxAttempts) {
      this.maxAttempts = maxAttempts
    }
    if (baseRetryIntervalMilliseconds) {
      this.baseRetryIntervalMilliseconds = baseRetryIntervalMilliseconds
    }
    if (retryMultiplier) {
      this.retryMultiplier = retryMultiplier
    }

    this.httpClient = new HttpClient(userAgent, [
      new BearerCredentialHandler(token)
    ])
  }

  // This function satisfies the Rpc interface. It is compatible with the JSON
  // JSON generated client.
  async request(
    service: string,
    method: string,
    contentType: 'application/json' | 'application/protobuf',
    data: object | Uint8Array
  ): Promise<object | Uint8Array> {
    const url = new URL(`/twirp/${service}/${method}`, this.baseUrl).href
    debug(`[Request] ${method} ${url}`)
    const headers = {
      'Content-Type': contentType
    }
    try {
      const {body} = await this.retryableRequest(async () =>
        this.httpClient.post(url, JSON.stringify(data), headers)
      )

      return JSON.parse(body)
    } catch (error) {
      throw new Error(`Failed to ${method}: ${error.message}`)
    }
  }

  async retryableRequest(
    operation: () => Promise<HttpClientResponse>
  ): Promise<{response: HttpClientResponse; body: string}> {
    let attempt = 0
    let errorMessage = ''
    while (attempt < this.maxAttempts) {
      let isRetryable = false

      try {
        const response = await operation()
        const statusCode = response.message.statusCode
        const body = await response.readBody()
        debug(`[Response] - ${response.message.statusCode}`)
        debug(`Headers: ${JSON.stringify(response.message.headers, null, 2)}`)
        debug(`Body: ${body}`)
        if (this.isSuccessStatusCode(statusCode)) {
          return {response, body}
        }
        isRetryable = this.isRetryableHttpStatusCode(statusCode)
        errorMessage = `Failed request: (${statusCode}) ${response.message.statusMessage}`
        const responseMessage = JSON.parse(body).msg
        if (responseMessage) {
          errorMessage = `${errorMessage}: ${responseMessage}`
        }
      } catch (error) {
        isRetryable = true
        errorMessage = error.message
      }

      if (!isRetryable) {
        throw new Error(`Received non-retryable error: ${errorMessage}`)
      }

      if (attempt + 1 === this.maxAttempts) {
        throw new Error(
          `Failed to make request after ${this.maxAttempts} attempts: ${errorMessage}`
        )
      }

      const retryTimeMilliseconds =
        this.getExponentialRetryTimeMilliseconds(attempt)
      info(
        `Attempt ${attempt + 1} of ${
          this.maxAttempts
        } failed with error: ${errorMessage}. Retrying request in ${retryTimeMilliseconds} ms...`
      )
      await this.sleep(retryTimeMilliseconds)
      attempt++
    }

    throw new Error(`Request failed`)
  }

  isSuccessStatusCode(statusCode?: number): boolean {
    if (!statusCode) return false
    return statusCode >= 200 && statusCode < 300
  }

  isRetryableHttpStatusCode(statusCode?: number): boolean {
    if (!statusCode) return false

    const retryableStatusCodes = [
      HttpCodes.BadGateway,
      HttpCodes.GatewayTimeout,
      HttpCodes.InternalServerError,
      HttpCodes.ServiceUnavailable,
      HttpCodes.TooManyRequests
    ]

    return retryableStatusCodes.includes(statusCode)
  }

  async sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  getExponentialRetryTimeMilliseconds(attempt: number): number {
    if (attempt < 0) {
      throw new Error('attempt should be a positive integer')
    }

    if (attempt === 0) {
      return this.baseRetryIntervalMilliseconds
    }

    const minTime =
      this.baseRetryIntervalMilliseconds * this.retryMultiplier ** attempt
    const maxTime = minTime * this.retryMultiplier

    // returns a random number between minTime and maxTime (exclusive)
    return Math.trunc(Math.random() * (maxTime - minTime) + minTime)
  }
}

export function internalArtifactTwirpClient(options?: {
  maxAttempts?: number
  retryIntervalMs?: number
  retryMultiplier?: number
}): ArtifactServiceClientJSON {
  const client = new ArtifactHttpClient(
    getUserAgentString(),
    options?.maxAttempts,
    options?.retryIntervalMs,
    options?.retryMultiplier
  )
  return new ArtifactServiceClientJSON(client)
}
