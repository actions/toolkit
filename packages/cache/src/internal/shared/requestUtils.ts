import * as core from '@actions/core'
import {
  HttpCodes,
  HttpClientError,
  HttpClientResponse
} from '@actions/http-client'
import {DefaultRetryDelay, DefaultRetryAttempts} from '../constants'
import {ITypedResponseWithError} from '../contracts'

import {debug, setSecret} from '@actions/core'

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

async function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export async function retry<T>(
  name: string,
  method: () => Promise<T>,
  getStatusCode: (arg0: T) => number | undefined,
  maxAttempts = DefaultRetryAttempts,
  delay = DefaultRetryDelay,
  onError: ((arg0: Error) => T | undefined) | undefined = undefined
): Promise<T> {
  let errorMessage = ''
  let attempt = 1

  while (attempt <= maxAttempts) {
    let response: T | undefined = undefined
    let statusCode: number | undefined = undefined
    let isRetryable = false

    try {
      response = await method()
    } catch (error) {
      if (onError) {
        response = onError(error)
      }

      isRetryable = true
      errorMessage = error.message
    }

    if (response) {
      statusCode = getStatusCode(response)

      if (!isServerErrorStatusCode(statusCode)) {
        return response
      }
    }

    if (statusCode) {
      isRetryable = isRetryableStatusCode(statusCode)
      errorMessage = `Cache service responded with ${statusCode}`
    }

    core.debug(
      `${name} - Attempt ${attempt} of ${maxAttempts} failed with error: ${errorMessage}`
    )

    if (!isRetryable) {
      core.debug(`${name} - Error is not retryable`)
      break
    }

    await sleep(delay)
    attempt++
  }

  throw Error(`${name} failed: ${errorMessage}`)
}

export async function retryTypedResponse<T>(
  name: string,
  method: () => Promise<ITypedResponseWithError<T>>,
  maxAttempts = DefaultRetryAttempts,
  delay = DefaultRetryDelay
): Promise<ITypedResponseWithError<T>> {
  return await retry(
    name,
    method,
    (response: ITypedResponseWithError<T>) => response.statusCode,
    maxAttempts,
    delay,
    // If the error object contains the statusCode property, extract it and return
    // an TypedResponse<T> so it can be processed by the retry logic.
    (error: Error) => {
      if (error instanceof HttpClientError) {
        return {
          statusCode: error.statusCode,
          result: null,
          headers: {},
          error
        }
      } else {
        return undefined
      }
    }
  )
}

export async function retryHttpClientResponse(
  name: string,
  method: () => Promise<HttpClientResponse>,
  maxAttempts = DefaultRetryAttempts,
  delay = DefaultRetryDelay
): Promise<HttpClientResponse> {
  return await retry(
    name,
    method,
    (response: HttpClientResponse) => response.message.statusCode,
    maxAttempts,
    delay
  )
}

/**
 * Masks the `sig` parameter in a URL and sets it as a secret.
 *
 * @param url - The URL containing the signature parameter to mask
 * @remarks
 * This function attempts to parse the provided URL and identify the 'sig' query parameter.
 * If found, it registers both the raw and URL-encoded signature values as secrets using
 * the Actions `setSecret` API, which prevents them from being displayed in logs.
 *
 * The function handles errors gracefully if URL parsing fails, logging them as debug messages.
 *
 * @example
 * ```typescript
 * // Mask a signature in an Azure SAS token URL
 * maskSigUrl('https://example.blob.core.windows.net/container/file.txt?sig=abc123&se=2023-01-01');
 * ```
 */
export function maskSigUrl(url: string): void {
  if (!url) return
  try {
    const parsedUrl = new URL(url)
    const signature = parsedUrl.searchParams.get('sig')
    if (signature) {
      setSecret(signature)
      setSecret(encodeURIComponent(signature))
    }
  } catch (error) {
    debug(
      `Failed to parse URL: ${url} ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Masks sensitive information in URLs containing signature parameters.
 * Currently supports masking 'sig' parameters in the 'signed_upload_url'
 * and 'signed_download_url' properties of the provided object.
 *
 * @param body - The object should contain a signature
 * @remarks
 * This function extracts URLs from the object properties and calls maskSigUrl
 * on each one to redact sensitive signature information. The function doesn't
 * modify the original object; it only marks the signatures as secrets for
 * logging purposes.
 *
 * @example
 * ```typescript
 * const responseBody = {
 *   signed_upload_url: 'https://blob.core.windows.net/?sig=abc123',
 *   signed_download_url: 'https://blob.core/windows.net/?sig=def456'
 * };
 * maskSecretUrls(responseBody);
 * ```
 */
export function maskSecretUrls(body: Record<string, unknown> | null): void {
  if (typeof body !== 'object' || body === null) {
    debug('body is not an object or is null')
    return
  }
  if (
    'signed_upload_url' in body &&
    typeof body.signed_upload_url === 'string'
  ) {
    maskSigUrl(body.signed_upload_url)
  }
  if (
    'signed_download_url' in body &&
    typeof body.signed_download_url === 'string'
  ) {
    maskSigUrl(body.signed_download_url)
  }
}
