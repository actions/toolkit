import {getOctokit} from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import * as core from '@actions/core'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import {getRetryOptions} from './retry-options'
import {requestLog} from '@octokit/plugin-request-log'
import {GetArtifactResponse} from '../shared/interfaces'
import {getBackendIdsFromToken} from '../shared/util'
import {getUserAgentString} from '../shared/user-agent'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client'
import {ListArtifactsRequest, StringValue} from '../../generated'

export async function getArtifactPublic(
  artifactName: string,
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string
): Promise<GetArtifactResponse> {
  const [retryOpts, requestOpts] = getRetryOptions(defaultGitHubOptions)

  const opts: OctokitOptions = {
    log: undefined,
    userAgent: getUserAgentString(),
    previews: undefined,
    retry: retryOpts,
    request: requestOpts
  }

  const github = getOctokit(token, opts, retry, requestLog)

  const getArtifactResp = await github.request(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts{?name}',
    {
      owner: repositoryOwner,
      repo: repositoryName,
      run_id: workflowRunId,
      name: artifactName
    }
  )

  if (getArtifactResp.status !== 200) {
    core.warning(`non-200 response from GitHub API: ${getArtifactResp.status}`)
    return {
      success: false
    }
  }

  if (getArtifactResp.data.artifacts.length === 0) {
    core.warning('no artifacts found')
    return {
      success: false
    }
  }

  if (getArtifactResp.data.artifacts.length > 1) {
    core.warning(
      'more than one artifact found for a single name, returning first'
    )
  }

  return {
    success: true,
    artifact: {
      name: getArtifactResp.data.artifacts[0].name,
      id: getArtifactResp.data.artifacts[0].id,
      size: getArtifactResp.data.artifacts[0].size_in_bytes
    }
  }
}

export async function getArtifactInternal(
  artifactName: string
): Promise<GetArtifactResponse> {
  const artifactClient = internalArtifactTwirpClient()

  const {workflowRunBackendId, workflowJobRunBackendId} =
    getBackendIdsFromToken()

  const req: ListArtifactsRequest = {
    workflowRunBackendId,
    workflowJobRunBackendId,
    nameFilter: StringValue.create({value: artifactName})
  }

  const res = await artifactClient.ListArtifacts(req)

  if (res.artifacts.length === 0) {
    core.warning('no artifacts found')
    return {
      success: false
    }
  }

  if (res.artifacts.length > 1) {
    core.warning(
      'more than one artifact found for a single name, returning first'
    )
  }

  // In the case of reruns, we may have artifacts with the same name scoped under the same workflow run.
  // Let's prefer the artifact closest scoped to this run.
  // If it doesn't exist (e.g. partial rerun) we'll use the first match.
  const artifact =
    res.artifacts.find(
      artifact => artifact.workflowRunBackendId === workflowRunBackendId
    ) || res.artifacts[0]

  return {
    success: true,
    artifact: {
      name: artifact.name,
      id: Number(artifact.databaseId),
      size: Number(artifact.size)
    }
  }
}
