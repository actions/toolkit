import {HttpClientResponse} from '@actions/http-client'
import {
  isRetryableStatusCode,
  isSuccessStatusCode,
  sleep,
  getExponentialRetryTimeInMilliseconds,
  displayHttpDiagnostics
} from './utils'
import * as core from '@actions/core'
import {getRetryLimit} from './config-variables'

export async function retry(
  name: string,
  operation: () => Promise<HttpClientResponse>,
  customErrorMessages: Map<number, string>,
  maxAttempts: number
): Promise<HttpClientResponse> {
  let response: HttpClientResponse | undefined = undefined
  let statusCode: number | undefined = undefined
  let isRetryable = false
  let errorMessage = ''
  let customErrorInformation: string | undefined = undefined
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      response = await operation()
      statusCode = response.message.statusCode

      if (isSuccessStatusCode(statusCode)) {
        return response
      }

      // Extra error information that we want to display if a particular response code is hit
      if (statusCode) {
        customErrorInformation = customErrorMessages.get(statusCode)
      }

      isRetryable = isRetryableStatusCode(statusCode)
      errorMessage = `Artifact service responded with ${statusCode}`
    } catch (error) {
      isRetryable = true
      errorMessage = error.message
    }

    if (!isRetryable) {
      core.info(`${name} - Error is not retryable`)
      if (response) {
        displayHttpDiagnostics(response)
      }
      break
    }

    core.info(
      `${name} - Attempt ${attempt} of ${maxAttempts} failed with error: ${errorMessage}`
    )

    await sleep(getExponentialRetryTimeInMilliseconds(attempt))
    attempt++
  }

  if (response) {
    displayHttpDiagnostics(response)
  }

  if (customErrorInformation) {
    throw Error(`${name} failed: ${customErrorInformation}`)
  }
  throw Error(`${name} failed: ${errorMessage}`)
}

export async function retryHttpClientRequest(
  name: string,
  method: () => Promise<HttpClientResponse>,
  customErrorMessages: Map<number, string> = new Map(),
  maxAttempts = getRetryLimit()
): Promise<HttpClientResponse> {
  return await retry(name, method, customErrorMessages, maxAttempts)
}
