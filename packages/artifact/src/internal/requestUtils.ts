import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {isRetryableStatusCode, isSuccessStatusCode, sleep} from './utils'
import * as core from '@actions/core'

export async function retry<T>(
  name: string,
  operation: () => Promise<T>,
  getStatusCode: (response: T) => number | undefined,
  errorMessages: Map<number, string>,
  maxAttempts: number,
  delayMilliseconds: number
): Promise<T> {
  let response: T | undefined = undefined
  let statusCode: number | undefined = undefined
  let isRetryable = false
  let errorMessage = ''
  let extraErrorInformation: string | undefined = undefined
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      response = await operation()
      statusCode = getStatusCode(response)

      if (isSuccessStatusCode(statusCode)) {
        return response
      }

      // Extra error information that we want to display if a particular response code is hit
      if (statusCode) {
        extraErrorInformation = errorMessages.get(statusCode)
      }

      isRetryable = isRetryableStatusCode(statusCode)
      errorMessage = `Artifact service responded with ${statusCode}`
    } catch (error) {
      isRetryable = true
      errorMessage = error.message
    }

    if (!isRetryable) {
      core.info(`${name} - Error is not retryable`)
      break
    }

    core.info(
      `${name} - Attempt ${attempt} of ${maxAttempts} failed with error: ${errorMessage}`
    )

    await sleep(delayMilliseconds)
    attempt++
  }

  if (extraErrorInformation) {
    throw Error(`${name} failed: ${errorMessage} : ${extraErrorInformation}`)
  }
  throw Error(`${name} failed: ${errorMessage}`)
}

export async function retryHttpClientRequest<T>(
  name: string,
  method: () => Promise<IHttpClientResponse>,
  errorMessages: Map<number, string> = new Map(),
  maxAttempts = 3
): Promise<IHttpClientResponse> {
  return await retry(
    name,
    method,
    (response: IHttpClientResponse) => response.message.statusCode,
    errorMessages,
    maxAttempts,
    5000
  )
}
