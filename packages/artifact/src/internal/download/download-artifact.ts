
import * as github from '@actions/github'
import * as core from '@actions/core'
import * as httpClient from '@actions/http-client'
import {
  DownloadArtifactOptions,
  DownloadArtifactResponse
} from '../shared/interfaces'
// import { getUserAgentString } from '../shared/user-agent'
// import * as unzipper from 'unzipper'

export async function downloadArtifact(
  artifactId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  const api = github.getOctokit(token)

  core.info(`Downloading artifact ${artifactId} from ${repositoryOwner}/${repositoryName}`)

  const {headers, status} = await api.rest.actions.downloadArtifact({
    owner: repositoryOwner,
    repo: repositoryName,
    artifact_id: artifactId,
    archive_format: 'zip',
    request: {
      redirect: 'manual',
    },
  })

  if (status !== 302) {
    throw new Error(`Unable to download artifact. Unexpected status: ${status}`)
  }

  const { location } = headers
  if (!location) {
    throw new Error(`Unable to redirect to artifact download url`)
  }

  const scrubbedURL = new URL(location);
  scrubbedURL.search = ''
  console.log(`Redirecting to blob download url: ${scrubbedURL.toString()}`)
  // const client = new httpClient.HttpClient(getUserAgentString(), [], {})

  // const response = await client.get(location)

  // response.message.pipe(unzipper.Extract({ path: options?.path }))

  return {success: true}
}