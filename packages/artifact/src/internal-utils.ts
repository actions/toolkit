import {debug} from '@actions/core'
import {promises as fs} from 'fs'
import {HttpCodes, HttpClient} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {IHeaders} from '@actions/http-client/interfaces'
import {
  getRuntimeToken,
  getRuntimeUrl,
  getWorkFlowRunId
} from './internal-config-variables'

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

export function isSuccessStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode >= 200 && statusCode < 300
}

export function isRetryableStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }

  const retryableStatusCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout,
    HttpCodes.InternalServerError
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

/**
 * Sets all the necessary headers when making HTTP calls
 * @param {string} contentType the type of content being uploaded
 * @param {boolean} isKeepAlive is the same connection being used to make multiple calls
 * @param {boolean} isGzip is the connection being used to upload GZip compressed content
 * @param {number} uncompressedLength the original size of the content if something is being uploaded that has been compressed
 * @param {number} contentLength the lenght of the content that is being uploaded
 * @param {string} contentRange the range of the content that is being uploaded
 * @returns appropriate request options to make a specific http call
 */
export function getRequestOptions(
  contentType?: string,
  isKeepAlive?: boolean,
  isGzip?: boolean,
  uncompressedLength?: number,
  contentLength?: number,
  contentRange?: string
): IHeaders {
  const requestOptions: IHeaders = {
    // same Accept type for each http call that gets made
    Accept: `application/json;api-version=${getApiVersion()}`
  }
  if (contentType) {
    requestOptions['Content-Type'] = contentType
  }
  if (isKeepAlive) {
    requestOptions['Connection'] = 'Keep-Alive'
    // keep alive for at least 10 seconds before closing the connection
    requestOptions['Keep-Alive'] = '10'
  }
  if (isGzip) {
    requestOptions['Content-Encoding'] = 'gzip'
    requestOptions['x-tfs-filelength'] = uncompressedLength
  }
  if (contentLength) {
    requestOptions['Content-Length'] = contentLength
  }
  if (contentRange) {
    requestOptions['Content-Range'] = contentRange
  }
  return requestOptions
}

export function createHttpClient(): HttpClient {
  return new HttpClient('action/artifact', [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

export function getArtifactUrl(): string {
  const artifactUrl = `${getRuntimeUrl()}_apis/pipelines/workflows/${getWorkFlowRunId()}/artifacts?api-version=${getApiVersion()}`
  debug(`Artifact Url: ${artifactUrl}`)
  return artifactUrl
}

/**
 * Invalid characters that cannot be in the artifact name or an uploaded file. Will be rejected
 * from the server if attempted to be sent over. These characters are not allowed due to limitations with certain
 * file systems such as NTFS. To maintain platform-agnostic behavior, all characters that are not supported by an
 * individual filesystem/platform will not be supported on all fileSystems/platforms
 *
 * FilePaths can include characters such as \ and / which are not permitted in the artifact name alone
 */
const invalidArtifactFilePathCharacters = [
  '"',
  ':',
  '<',
  '>',
  '|',
  '*',
  '?',
  ' '
]
const invalidArtifactNameCharacters = [
  '"',
  ':',
  '<',
  '>',
  '|',
  '*',
  '?',
  ' ',
  '\\',
  '/'
]

/**
 * Scans the name of the artifact to make sure there are no illegal characters
 */
export function checkArtifactName(name: string): void {
  if (!name) {
    throw new Error(`Artifact name: ${name}, is incorrectly provided`)
  }

  for (const invalidChar of invalidArtifactNameCharacters) {
    if (name.includes(invalidChar)) {
      throw new Error(
        `Artifact name is not valid: ${name}. Contains character: "${invalidChar}". Invalid artifact name characters include: ${invalidArtifactNameCharacters.toString()}.`
      )
    }
  }
}

/**
 * Scans the name of the filePath used to make sure there are no illegal characters
 */
export function checkArtifactFilePath(path: string): void {
  if (!path) {
    throw new Error(`Artifact path: ${path}, is incorrectly provided`)
  }

  for (const invalidChar of invalidArtifactFilePathCharacters) {
    if (path.includes(invalidChar)) {
      throw new Error(
        `Artifact path is not valid: ${path}. Contains character: "${invalidChar}". Invalid characters include: ${invalidArtifactFilePathCharacters.toString()}.`
      )
    }
  }
}

export async function createDirectoriesForArtifact(
  directories: string[]
): Promise<void> {
  for (const directory of directories) {
    await fs.mkdir(directory, {
      recursive: true
    })
  }
}
