import * as core from '@actions/core'
import {HttpCodes} from '@actions/http-client'
import {
  IHttpClientResponse,
  ITypedResponse
} from '@actions/http-client/interfaces'

export function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

export function isServerErrorStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return true
  }
  return statusCode >= 500
}

export function isRetryableStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  const retryableStatusCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
  ]
  return retryableStatusCodes.includes(statusCode)
}

export async function retry<T>(
  name: string,
  method: () => Promise<T>,
  getStatusCode: (arg0: T) => number | undefined,
  maxAttempts = 2
): Promise<T> {
  let response: T | undefined = undefined
  let statusCode: number | undefined = undefined
  let isRetryable = false
  let errorMessage = ''
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      response = await method()
      statusCode = getStatusCode(response)

      if (!isServerErrorStatusCode(statusCode)) {
        return response
      }

      isRetryable = isRetryableStatusCode(statusCode)
      errorMessage = `Cache service responded with ${statusCode}`
    } catch (error) {
      isRetryable = true
      errorMessage = error.message
    }

    core.debug(
      `${name} - Attempt ${attempt} of ${maxAttempts} failed with error: ${errorMessage}`
    )

    if (!isRetryable) {
      core.debug(`${name} - Error is not retryable`)
      break
    }

    attempt++
  }

  throw Error(`${name} failed: ${errorMessage}`)
}

export async function retryTypedResponse<T>(
  name: string,
  method: () => Promise<ITypedResponse<T>>,
  maxAttempts = 2
): Promise<ITypedResponse<T>> {
  return await retry(
    name,
    method,
    (response: ITypedResponse<T>) => response.statusCode,
    maxAttempts
  )
}

export async function retryHttpClientResponse<T>(
  name: string,
  method: () => Promise<IHttpClientResponse>,
  maxAttempts = 2
): Promise<IHttpClientResponse> {
  return await retry(
    name,
    method,
    (response: IHttpClientResponse) => response.message.statusCode,
    maxAttempts
  )
}
