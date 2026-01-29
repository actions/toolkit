import {info, debug} from '@actions/core'
import {getOctokit} from '@actions/github'
import {DeleteArtifactResponse} from '../shared/interfaces.js'
import {getUserAgentString} from '../shared/user-agent.js'
import {getRetryOptions} from '../find/retry-options.js'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'
import type {OctokitOptions} from '@octokit/core/types'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client.js'
import {getBackendIdsFromToken} from '../shared/util.js'
import {
  DeleteArtifactRequest,
  ListArtifactsRequest,
  StringValue
} from '../../generated/index.js'
import {getArtifactPublic} from '../find/get-artifact.js'
import {ArtifactNotFoundError, InvalidResponseError} from '../shared/errors.js'

export async function deleteArtifactPublic(
  artifactName: string,
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string
): Promise<DeleteArtifactResponse> {
  const [retryOpts, requestOpts] = getRetryOptions(defaultGitHubOptions)

  const opts: OctokitOptions = {
    log: undefined,
    userAgent: getUserAgentString(),
    previews: undefined,
    retry: retryOpts,
    request: requestOpts
  }

  const github = getOctokit(token, opts, retry, requestLog)

  const getArtifactResp = await getArtifactPublic(
    artifactName,
    workflowRunId,
    repositoryOwner,
    repositoryName,
    token
  )

  const deleteArtifactResp = await github.rest.actions.deleteArtifact({
    owner: repositoryOwner,
    repo: repositoryName,
    artifact_id: getArtifactResp.artifact.id
  })

  if (deleteArtifactResp.status !== 204) {
    throw new InvalidResponseError(
      `Invalid response from GitHub API: ${deleteArtifactResp.status} (${deleteArtifactResp?.headers?.['x-github-request-id']})`
    )
  }

  return {
    id: getArtifactResp.artifact.id
  }
}

export async function deleteArtifactInternal(
  artifactName
): Promise<DeleteArtifactResponse> {
  const artifactClient = internalArtifactTwirpClient()

  const {workflowRunBackendId, workflowJobRunBackendId} =
    getBackendIdsFromToken()

  const listReq: ListArtifactsRequest = {
    workflowRunBackendId,
    workflowJobRunBackendId,
    nameFilter: StringValue.create({value: artifactName})
  }

  const listRes = await artifactClient.ListArtifacts(listReq)

  if (listRes.artifacts.length === 0) {
    throw new ArtifactNotFoundError(
      `Artifact not found for name: ${artifactName}`
    )
  }

  let artifact = listRes.artifacts[0]
  if (listRes.artifacts.length > 1) {
    artifact = listRes.artifacts.sort(
      (a, b) => Number(b.databaseId) - Number(a.databaseId)
    )[0]

    debug(
      `More than one artifact found for a single name, returning newest (id: ${artifact.databaseId})`
    )
  }

  const req: DeleteArtifactRequest = {
    workflowRunBackendId: artifact.workflowRunBackendId,
    workflowJobRunBackendId: artifact.workflowJobRunBackendId,
    name: artifact.name
  }

  const res = await artifactClient.DeleteArtifact(req)
  info(`Artifact '${artifactName}' (ID: ${res.artifactId}) deleted`)

  return {
    id: Number(res.artifactId)
  }
}
