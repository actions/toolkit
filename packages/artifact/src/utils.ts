import {debug} from '@actions/core'
import {HttpCodes, HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IHeaders} from '@actions/http-client/interfaces'

/**
 * Parses a env variable that is a number
 */
export function parseEnvNumber(key: string): number | undefined {
  const value = Number(process.env[key])
  if (Number.isNaN(value) || value < 0) {
    return undefined
  }
  return value
}

/**
 * Various utility functions to help with the necessary API calls
 */
export function getApiVersion(): string {
  return '6.0-preview'
}

export function isSuccessStatusCode(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300
}

export function isRetryableStatusCode(statusCode: number): boolean {
  const retryableStatusCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
  ]
  return retryableStatusCodes.includes(statusCode)
}

export function getContentRange(
  start: number,
  end: number,
  total: number
): string {
  // Format: `bytes start-end/fileSize
  // start and end are inclusive
  // For a 200 byte chunk starting at byte 0:
  // Content-Range: bytes 0-199/200
  return `bytes ${start}-${end}/${total}`
}

export function getRequestOptions(
  contentType?: string,
  contentLength?: number,
  contentRange?: string
): IHeaders {
  const requestOptions: IHeaders = {
    Accept: `application/json;api-version=${getApiVersion()}`
  }
  if (contentType) {
    requestOptions['Content-Type'] = contentType
  }
  if (contentLength) {
    requestOptions['Content-Length'] = contentLength
  }
  if (contentRange) {
    requestOptions['Content-Range'] = contentRange
  }
  return requestOptions
}

export function createHttpClient(token: string): HttpClient {
  return new HttpClient('action/artifact', [new BearerCredentialHandler(token)])
}

export function getArtifactUrl(runtimeUrl: string, runId: string): string {
  const artifactUrl = `${runtimeUrl}_apis/pipelines/workflows/${runId}/artifacts?api-version=${getApiVersion()}`
  debug(`Artifact Url: ${artifactUrl}`)
  return artifactUrl
}

/**
 * Invalid characters that cannot be in the artifact name or an uploaded file. Will be rejected
 * from the server if attempted to be sent over. These characters are not allowed due to limitations with certain
 * file systems such as NTFS. To maintain platform-agnostic behavior, all characters that are not supported by an
 * individual filesystem/platform will not be supported on all fileSystems/platforms
 */
const invalidCharacters = ['\\', '/', '"', ':', '<', '>', '|', '*', '?', ' ']

/**
 * Scans the name of the item being uploaded to make sure there are no illegal characters
 */
export function checkArtifactName(name: string): void {
  if (!name) {
    throw new Error(`Artifact name: ${name}, is incorrectly provided`)
  }
  for (const invalidChar of invalidCharacters) {
    if (name.includes(invalidChar)) {
      throw new Error(
        `Artifact name is not valid: ${name}. Contains character: "${invalidChar}". Invalid characters include: ${invalidCharacters.toString()}.`
      )
    }
  }
}
