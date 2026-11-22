import fs from 'fs/promises'
import * as fsSync from 'fs'
import * as crypto from 'crypto'
import * as stream from 'stream'
import * as path from 'path'

import * as github from '@actions/github'
import * as core from '@actions/core'
import * as httpClient from '@actions/http-client'
import unzip from 'unzip-stream'
import {
  DownloadArtifactOptions,
  DownloadArtifactResponse,
  StreamExtractResponse
} from '../shared/interfaces.js'
import {getUserAgentString} from '../shared/user-agent.js'
import {getGitHubWorkspaceDir} from '../shared/config.js'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client.js'
import {
  GetSignedArtifactURLRequest,
  Int64Value,
  ListArtifactsRequest
} from '../../generated/index.js'
import {getBackendIdsFromToken} from '../shared/util.js'
import {ArtifactNotFoundError} from '../shared/errors.js'

// How often the minimum download throughput is checked
const throughputCheckInterval = 1000

const scrubQueryParameters = (url: string): string => {
  const parsed = new URL(url)
  parsed.search = ''
  return parsed.toString()
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    } else {
      throw error
    }
  }
}

async function streamExtract(
  url: string,
  directory: string,
  skipDecompress?: boolean
): Promise<StreamExtractResponse> {
  const maxAttempts = 5
  let retryCount = 0
  while (retryCount < maxAttempts) {
    // Disable the minimum throughput check on the last attempt, so that a
    // connection that is slow on every attempt still completes the download
    const isLastAttempt = retryCount === maxAttempts - 1
    try {
      return await streamExtractExternal(url, directory, {
        skipDecompress,
        minBytesPerSecond: isLastAttempt ? 0 : undefined
      })
    } catch (error) {
      retryCount++
      core.debug(
        `Failed to download artifact after ${retryCount} retries due to ${error.message}. Retrying in 5 seconds...`
      )
      // wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  throw new Error(`Artifact download failed after ${retryCount} retries.`)
}

export async function streamExtractExternal(
  url: string,
  directory: string,
  opts: {
    timeout?: number
    skipDecompress?: boolean
    minBytesPerSecond?: number
    throughputWindow?: number
  } = {}
): Promise<StreamExtractResponse> {
  const {
    timeout = 30 * 1000,
    skipDecompress = false,
    minBytesPerSecond = 1024 * 1024,
    throughputWindow = 30 * 1000
  } = opts
  const client = new httpClient.HttpClient(getUserAgentString())
  const response = await client.get(url)
  if (response.message.statusCode !== 200) {
    throw new Error(
      `Unexpected HTTP response from blob storage: ${response.message.statusCode} ${response.message.statusMessage}`
    )
  }

  const contentType = response.message.headers['content-type'] || ''
  const mimeType = contentType.split(';', 1)[0].trim().toLowerCase()

  // Check if the URL path ends with .zip (ignoring query parameters)
  const urlPath = new URL(url).pathname.toLowerCase()
  const urlEndsWithZip = urlPath.endsWith('.zip')

  const isZip =
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed' ||
    mimeType === 'application/zip-compressed' ||
    urlEndsWithZip

  // Extract filename from Content-Disposition header
  // Prefer filename* (RFC 5987) which supports UTF-8 encoded filenames,
  // fall back to filename which may contain ASCII-only replacements
  const contentDisposition =
    response.message.headers['content-disposition'] || ''
  let fileName = 'artifact'
  const filenameStar = contentDisposition.match(
    /filename\*\s*=\s*UTF-8''([^;\r\n]*)/i
  )
  const filenamePlain = contentDisposition.match(
    /(?<!\*)filename\s*=\s*['"]?([^;\r\n"']*)['"]?/i
  )
  const rawName = filenameStar?.[1] || filenamePlain?.[1]
  if (rawName) {
    // Sanitize fileName to prevent path traversal attacks
    // Use path.basename to extract only the filename component
    fileName = path.basename(decodeURIComponent(rawName.trim()))
  }

  core.debug(
    `Content-Type: ${contentType}, mimeType: ${mimeType}, urlEndsWithZip: ${urlEndsWithZip}, isZip: ${isZip}, skipDecompress: ${skipDecompress}`
  )
  core.debug(
    `Content-Disposition: ${contentDisposition}, fileName: ${fileName}`
  )

  let sha256Digest: string | undefined = undefined

  return new Promise((resolve, reject) => {
    let throughputTimer: NodeJS.Timeout | undefined = undefined

    const timerFn = (): void => {
      const timeoutError = new Error(
        `Blob storage chunk did not respond in ${timeout}ms`
      )
      clearInterval(throughputTimer)
      response.message.destroy(timeoutError)
      reject(timeoutError)
    }
    const timer = setTimeout(timerFn, timeout)

    const onError = (error: Error): void => {
      core.debug(`response.message: Artifact download failed: ${error.message}`)
      clearTimeout(timer)
      clearInterval(throughputTimer)
      reject(error)
    }

    let intervalBytes = 0
    const hashStream = crypto.createHash('sha256').setEncoding('hex')
    const passThrough = new stream.PassThrough()
      .on('data', (chunk: Buffer) => {
        timer.refresh()
        intervalBytes += chunk.length
      })
      .on('error', onError)

    // Abort if too little data arrived over the trailing window, so that the
    // download is retried on a new connection. Bytes are counted per check
    // interval. The check is skipped while the window includes an interval in
    // which the download was paused because writing to disk could not keep
    // up, since a new connection would not help.
    let consumerBusy = false
    const isPaused = (): boolean =>
      response.message.readableFlowing === false ||
      passThrough.readableFlowing === false
    const onPause = (): void => {
      consumerBusy = true
    }
    response.message.on('pause', onPause)
    passThrough.on('pause', onPause)
    if (minBytesPerSecond > 0) {
      const minWindowBytes = (minBytesPerSecond * throughputWindow) / 1000
      const windowIntervals = Math.ceil(
        throughputWindow / throughputCheckInterval
      )
      const recentBytes: number[] = []
      const recentBusy: boolean[] = []
      throughputTimer = setInterval(() => {
        recentBytes.push(intervalBytes)
        recentBusy.push(consumerBusy)
        if (recentBytes.length > windowIntervals) {
          recentBytes.shift()
          recentBusy.shift()
        }
        intervalBytes = 0
        consumerBusy = isPaused()

        if (recentBytes.length < windowIntervals || recentBusy.includes(true)) {
          return
        }
        const windowBytes = recentBytes.reduce((sum, bytes) => sum + bytes, 0)
        if (windowBytes < minWindowBytes) {
          const throughputError = new Error(
            `Blob storage download too slow: received ${windowBytes} bytes in the last ${throughputWindow}ms, expected at least ${minBytesPerSecond} bytes/s`
          )
          core.info(
            `${throughputError.message}. Aborting this download attempt.`
          )
          clearTimeout(timer)
          clearInterval(throughputTimer)
          response.message.destroy(throughputError)
          reject(throughputError)
        }
      }, throughputCheckInterval)
    }

    response.message.pipe(passThrough)
    passThrough.pipe(hashStream)

    const onClose = (): void => {
      clearTimeout(timer)
      clearInterval(throughputTimer)
      if (hashStream) {
        hashStream.end()
        sha256Digest = hashStream.read() as string
        core.info(`SHA256 digest of downloaded artifact is ${sha256Digest}`)
      }
      resolve({sha256Digest: `sha256:${sha256Digest}`})
    }

    if (isZip && !skipDecompress) {
      // Extract zip file
      passThrough
        .pipe(unzip.Extract({path: directory}))
        .on('close', onClose)
        .on('error', onError)
    } else {
      // Save raw file without extracting
      const filePath = path.join(directory, fileName)
      const writeStream = fsSync.createWriteStream(filePath)

      core.info(`Downloading raw file (non-zip) to: ${filePath}`)
      passThrough.pipe(writeStream).on('close', onClose).on('error', onError)
    }
  })
}

export async function downloadArtifactPublic(
  artifactId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  const downloadPath = await resolveOrCreateDirectory(options?.path)

  const api = github.getOctokit(token)

  let digestMismatch = false

  core.info(
    `Downloading artifact '${artifactId}' from '${repositoryOwner}/${repositoryName}'`
  )

  const {headers, status} = await api.rest.actions.downloadArtifact({
    owner: repositoryOwner,
    repo: repositoryName,
    artifact_id: artifactId,
    archive_format: 'zip',
    request: {
      redirect: 'manual'
    }
  })

  if (status !== 302) {
    throw new Error(`Unable to download artifact. Unexpected status: ${status}`)
  }

  const {location} = headers
  if (!location) {
    throw new Error(`Unable to redirect to artifact download url`)
  }

  core.info(
    `Redirecting to blob download url: ${scrubQueryParameters(location)}`
  )

  try {
    core.info(`Starting download of artifact to: ${downloadPath}`)
    const extractResponse = await streamExtract(
      location,
      downloadPath,
      options?.skipDecompress
    )
    core.info(`Artifact download completed successfully.`)
    if (options?.expectedHash) {
      if (options?.expectedHash !== extractResponse.sha256Digest) {
        digestMismatch = true
        core.debug(`Computed digest: ${extractResponse.sha256Digest}`)
        core.debug(`Expected digest: ${options.expectedHash}`)
      }
    }
  } catch (error) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return {downloadPath, digestMismatch}
}

export async function downloadArtifactInternal(
  artifactId: number,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  const downloadPath = await resolveOrCreateDirectory(options?.path)

  const artifactClient = internalArtifactTwirpClient()

  let digestMismatch = false

  const {workflowRunBackendId, workflowJobRunBackendId} =
    getBackendIdsFromToken()

  const listReq: ListArtifactsRequest = {
    workflowRunBackendId,
    workflowJobRunBackendId,
    idFilter: Int64Value.create({value: artifactId.toString()})
  }

  const {artifacts} = await artifactClient.ListArtifacts(listReq)

  if (artifacts.length === 0) {
    throw new ArtifactNotFoundError(
      `No artifacts found for ID: ${artifactId}\nAre you trying to download from a different run? Try specifying a github-token with \`actions:read\` scope.`
    )
  }

  if (artifacts.length > 1) {
    core.warning('Multiple artifacts found, defaulting to first.')
  }

  const signedReq: GetSignedArtifactURLRequest = {
    workflowRunBackendId: artifacts[0].workflowRunBackendId,
    workflowJobRunBackendId: artifacts[0].workflowJobRunBackendId,
    name: artifacts[0].name
  }

  const {signedUrl} = await artifactClient.GetSignedArtifactURL(signedReq)

  core.info(
    `Redirecting to blob download url: ${scrubQueryParameters(signedUrl)}`
  )

  try {
    core.info(`Starting download of artifact to: ${downloadPath}`)
    const extractResponse = await streamExtract(
      signedUrl,
      downloadPath,
      options?.skipDecompress
    )
    core.info(`Artifact download completed successfully.`)
    if (options?.expectedHash) {
      if (options?.expectedHash !== extractResponse.sha256Digest) {
        digestMismatch = true
        core.debug(`Computed digest: ${extractResponse.sha256Digest}`)
        core.debug(`Expected digest: ${options.expectedHash}`)
      }
    }
  } catch (error) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return {downloadPath, digestMismatch}
}

async function resolveOrCreateDirectory(
  downloadPath = getGitHubWorkspaceDir()
): Promise<string> {
  if (!(await exists(downloadPath))) {
    core.debug(
      `Artifact destination folder does not exist, creating: ${downloadPath}`
    )
    await fs.mkdir(downloadPath, {recursive: true})
  } else {
    core.debug(`Artifact destination folder already exists: ${downloadPath}`)
  }

  return downloadPath
}
