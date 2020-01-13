import {HttpCodes, HttpClient} from '@actions/http-client'
import {debug} from '@actions/core'
import {IHeaders} from '@actions/http-client/interfaces'

const apiVersion: string = '6.0-preview'

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
 * Various utlity functions to help with the neceesary API calls
 */
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
  // Format: `bytes start-end/filesize
  // start and end are inclusive
  // For a 200 byte chunk starting at byte 0:
  // Content-Range: bytes 0-199/200
  return `bytes ${start}-${end}/${total}`
}

export function getArtifactUrl(): string {
  const runtimeUrl = process.env['ACTIONS_RUNTIME_URL']
  if (!runtimeUrl) {
    throw new Error('Runtime url not found, unable to create artifact.')
  }
  const artifactUrl = `${runtimeUrl}_apis/pipelines/workflows/${getWorkFlowRunId()}/artifacts?api-version=${apiVersion}`
  debug(`Artifact Url: ${artifactUrl}`)
  return artifactUrl
}

export function getRequestOptions(): IHeaders {
  const requestOptions: IHeaders = {
    Accept: createAcceptHeader('application/json', apiVersion)
  }
  return requestOptions
}

export function createAcceptHeader(type: string, apiVersion: string): string {
  return `${type};api-version=${apiVersion}`
}

function getWorkFlowRunId(): string {
  const workFlowrunId = process.env['GITHUB_RUN_ID'] || ''
  if (!workFlowrunId) {
    throw new Error('Unable to get workFlowRunId')
  }
  return workFlowrunId!
}

/**
 * Invalid characters that cannot be in the artifact name or an uploaded file. Will be rejected
 * from the server if attempted to be sent over. These characters are not allowed due to limitations with certain
 * file systems such as NTFS. To maitain platform-agnostic behavior, all characters that are not supported by an
 * individual filesystem/platform will not be supported on all filesystems/platforms
 */
const invalidCharacters = ['\\', '/', '"', ':', '<', '>', '|', '*', '?']

/**
 * Scans the name of the item being uploaded to make sure there are no illegal characters
 */
export function checkArtifactName(name: string) {
  invalidCharacters.forEach(function(invalidChar) {
    if (name.indexOf(invalidChar) > -1) {
      throw new Error(
        `Artifact name is not valid: ${name}. Contains character: "${invalidChar}". Invalid characters include: ${invalidCharacters.toString()}.`
      )
    }
  })
}
