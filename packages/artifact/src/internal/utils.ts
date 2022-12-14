import crypto from 'crypto'
import {promises as fs} from 'fs'
import {IncomingHttpHeaders, OutgoingHttpHeaders} from 'http'
import {debug, info, warning} from '@actions/core'
import {HttpCodes, HttpClient, HttpClientResponse} from '@actions/http-client'
import {BearerCredentialHandler} from '@actions/http-client/lib/auth'
import {
  getRuntimeToken,
  getRuntimeUrl,
  getWorkFlowRunId,
  getRetryMultiplier,
  getInitialRetryIntervalInMilliseconds
} from './config-variables'
import CRC64 from './crc64'

/**
 * Returns a retry time in milliseconds that exponentially gets larger
 * depending on the amount of retries that have been attempted
 */
export function getExponentialRetryTimeInMilliseconds(
  retryCount: number
): number {
  if (retryCount < 0) {
    throw new Error('RetryCount should not be negative')
  } else if (retryCount === 0) {
    return getInitialRetryIntervalInMilliseconds()
  }

  const minTime =
    getInitialRetryIntervalInMilliseconds() * getRetryMultiplier() * retryCount
  const maxTime = minTime * getRetryMultiplier()

  // returns a random number between the minTime (inclusive) and the maxTime (exclusive)
  return Math.trunc(Math.random() * (maxTime - minTime) + minTime)
}

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

export function isForbiddenStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode === HttpCodes.Forbidden
}

export function isRetryableStatusCode(statusCode: number | undefined): boolean {
  if (!statusCode) {
    return false
  }

  const retryableStatusCodes = [
    HttpCodes.BadGateway,
    HttpCodes.GatewayTimeout,
    HttpCodes.InternalServerError,
    HttpCodes.ServiceUnavailable,
    HttpCodes.TooManyRequests,
    413 // Payload Too Large
  ]
  return retryableStatusCodes.includes(statusCode)
}

export function isThrottledStatusCode(statusCode?: number): boolean {
  if (!statusCode) {
    return false
  }
  return statusCode === HttpCodes.TooManyRequests
}

/**
 * Attempts to get the retry-after value from a set of http headers. The retry time
 * is originally denoted in seconds, so if present, it is converted to milliseconds
 * @param headers all the headers received when making an http call
 */
export function tryGetRetryAfterValueTimeInMilliseconds(
  headers: IncomingHttpHeaders
): number | undefined {
  if (headers['retry-after']) {
    const retryTime = Number(headers['retry-after'])
    if (!isNaN(retryTime)) {
      info(`Retry-After header is present with a value of ${retryTime}`)
      return retryTime * 1000
    }
    info(
      `Returned retry-after header value: ${retryTime} is non-numeric and cannot be used`
    )
    return undefined
  }
  info(
    `No retry-after header was found. Dumping all headers for diagnostic purposes`
  )
  // eslint-disable-next-line no-console
  console.log(headers)
  return undefined
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
 * Sets all the necessary headers when downloading an artifact
 * @param {string} contentType the type of content being uploaded
 * @param {boolean} isKeepAlive is the same connection being used to make multiple calls
 * @param {boolean} acceptGzip can we accept a gzip encoded response
 * @param {string} acceptType the type of content that we can accept
 * @returns appropriate headers to make a specific http call during artifact download
 */
export function getDownloadHeaders(
  contentType: string,
  isKeepAlive?: boolean,
  acceptGzip?: boolean
): OutgoingHttpHeaders {
  const requestOptions: OutgoingHttpHeaders = {}

  if (contentType) {
    requestOptions['Content-Type'] = contentType
  }
  if (isKeepAlive) {
    requestOptions['Connection'] = 'Keep-Alive'
    // keep alive for at least 10 seconds before closing the connection
    requestOptions['Keep-Alive'] = '10'
  }
  if (acceptGzip) {
    // if we are expecting a response with gzip encoding, it should be using an octet-stream in the accept header
    requestOptions['Accept-Encoding'] = 'gzip'
    requestOptions[
      'Accept'
    ] = `application/octet-stream;api-version=${getApiVersion()}`
  } else {
    // default to application/json if we are not working with gzip content
    requestOptions['Accept'] = `application/json;api-version=${getApiVersion()}`
  }

  return requestOptions
}

/**
 * Sets all the necessary headers when uploading an artifact
 * @param {string} contentType the type of content being uploaded
 * @param {boolean} isKeepAlive is the same connection being used to make multiple calls
 * @param {boolean} isGzip is the connection being used to upload GZip compressed content
 * @param {number} uncompressedLength the original size of the content if something is being uploaded that has been compressed
 * @param {number} contentLength the length of the content that is being uploaded
 * @param {string} contentRange the range of the content that is being uploaded
 * @returns appropriate headers to make a specific http call during artifact upload
 */
export function getUploadHeaders(
  contentType: string,
  isKeepAlive?: boolean,
  isGzip?: boolean,
  uncompressedLength?: number,
  contentLength?: number,
  contentRange?: string,
  digest?: StreamDigest
): OutgoingHttpHeaders {
  const requestOptions: OutgoingHttpHeaders = {}
  requestOptions['Accept'] = `application/json;api-version=${getApiVersion()}`
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
  if (digest) {
    requestOptions['x-actions-results-crc64'] = digest.crc64
    requestOptions['x-actions-results-md5'] = digest.md5
  }

  return requestOptions
}

export function createHttpClient(userAgent: string): HttpClient {
  return new HttpClient(userAgent, [
    new BearerCredentialHandler(getRuntimeToken())
  ])
}

export function getArtifactUrl(): string {
  const artifactUrl = `${getRuntimeUrl()}_apis/pipelines/workflows/${getWorkFlowRunId()}/artifacts?api-version=${getApiVersion()}`
  debug(`Artifact Url: ${artifactUrl}`)
  return artifactUrl
}

/**
 * Uh oh! Something might have gone wrong during either upload or download. The IHtttpClientResponse object contains information
 * about the http call that was made by the actions http client. This information might be useful to display for diagnostic purposes, but
 * this entire object is really big and most of the information is not really useful. This function takes the response object and displays only
 * the information that we want.
 *
 * Certain information such as the TLSSocket and the Readable state are not really useful for diagnostic purposes so they can be avoided.
 * Other information such as the headers, the response code and message might be useful, so this is displayed.
 */
export function displayHttpDiagnostics(response: HttpClientResponse): void {
  info(
    `##### Begin Diagnostic HTTP information #####
Status Code: ${response.message.statusCode}
Status Message: ${response.message.statusMessage}
Header Information: ${JSON.stringify(response.message.headers, undefined, 2)}
###### End Diagnostic HTTP information ######`
  )
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

export async function createEmptyFilesForArtifact(
  emptyFilesToCreate: string[]
): Promise<void> {
  for (const filePath of emptyFilesToCreate) {
    await (await fs.open(filePath, 'w')).close()
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  debug(
    `${filePath} size:(${stats.size}) blksize:(${stats.blksize}) blocks:(${stats.blocks})`
  )
  return stats.size
}

export async function rmFile(filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

export function getProperRetention(
  retentionInput: number,
  retentionSetting: string | undefined
): number {
  if (retentionInput < 0) {
    throw new Error('Invalid retention, minimum value is 1.')
  }

  let retention = retentionInput
  if (retentionSetting) {
    const maxRetention = parseInt(retentionSetting)
    if (!isNaN(maxRetention) && maxRetention < retention) {
      warning(
        `Retention days is greater than the max value allowed by the repository setting, reduce retention to ${maxRetention} days`
      )
      retention = maxRetention
    }
  }
  return retention
}

export async function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export interface StreamDigest {
  crc64: string
  md5: string
}

export async function digestForStream(
  stream: NodeJS.ReadableStream
): Promise<StreamDigest> {
  return new Promise((resolve, reject) => {
    const crc64 = new CRC64()
    const md5 = crypto.createHash('md5')
    stream
      .on('data', data => {
        crc64.update(data)
        md5.update(data)
      })
      .on('end', () =>
        resolve({
          crc64: crc64.digest('base64') as string,
          md5: md5.digest('base64')
        })
      )
      .on('error', reject)
  })
}
