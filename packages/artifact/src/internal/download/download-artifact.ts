import fs from 'fs/promises'
import * as github from '@actions/github'
import * as core from '@actions/core'
import * as httpClient from '@actions/http-client'
import unzip from 'unzip-stream'
import {
  DownloadArtifactOptions,
  DownloadArtifactResponse
} from '../shared/interfaces'
import {getUserAgentString} from '../shared/user-agent'
import {getGitHubWorkspaceDir} from '../shared/config'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client'
import {
  GetSignedArtifactURLRequest,
  Int64Value,
  ListArtifactsRequest
} from '../../generated'
import {getBackendIdsFromToken} from '../shared/util'
import {ArtifactNotFoundError} from '../shared/errors'
import { clear } from 'console'

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

async function streamExtract(url: string, directory: string): Promise<void> {
  let retryCount = 0
  while (retryCount < 5) {
    try {
       await streamExtractInternal(url, directory)
       core.info(`Artifact downloaded successfully after ${retryCount} retries.`)
       return
    } catch (error) {
      retryCount++
      core.warning(`Failed to download artifact after ${retryCount} retries due to ${error.message}. Retrying in 5 seconds...`)
      // wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  throw new Error(`Artifact download failed after ${retryCount} retries.`)
}

async function streamExtractInternal(url: string,directory: string): Promise<void> {
  const client = new httpClient.HttpClient(getUserAgentString())
  const response = await client.get(url)

  if (response.message.statusCode !== 200) {
    throw new Error(
      `Unexpected HTTP response from blob storage: ${response.message.statusCode} ${response.message.statusMessage}`
    )
  }

  const timeout = 30 * 1000 // 30 seconds

  return new Promise((resolve, reject) => {
    const timerFn = (): void => {
      // close response stream
      core.warning("timerFn: closing response stream")
      response.message.destroy(new Error(`Blob storage chunk did not respond in ${timeout}ms`))
    }
    let timer = setTimeout(timerFn, timeout)

    response.message
      .on('data', () => {
        timer.refresh()
      })
      .on('error', (error: Error) => {
        core.warning(`response.message: Artifact download failed: ${error.message}`)
        clearTimeout(timer)
        reject(error)
      })
      .pipe(unzip.Extract({path: directory}))
      .on('close', () => {
        core.info(`zip stream: Artifact downloaded to: ${directory}`)
        clearTimeout(timer)
        resolve()
      })
      .on('error', (error: Error) => {
        core.warning(`zip stream: Artifact download failed: ${error.message}`)
        reject(error)
      })
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
    await streamExtract(location, downloadPath)
    core.info(`Artifact download completed successfully.`)
  } catch (error) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return {downloadPath}
}

export async function downloadArtifactInternal(
  artifactId: number,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  const downloadPath = await resolveOrCreateDirectory(options?.path)

  const artifactClient = internalArtifactTwirpClient()

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
    await streamExtract(signedUrl, downloadPath)
    core.info(`Artifact download completed successfully.`)
  } catch (error) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return {downloadPath}
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
