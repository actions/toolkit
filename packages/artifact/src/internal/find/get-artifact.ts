import {GetArtifactResponse} from '../shared/interfaces'
import {getOctokit} from '@actions/github'
import {getUserAgentString} from '../shared/user-agent'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import {getRetryOptions} from './retry-options'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'
import * as core from '@actions/core'
import {OctokitOptions} from '@octokit/core/dist-types/types'

export async function getArtifact(
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
      url: getArtifactResp.data.artifacts[0].url,
      size: getArtifactResp.data.artifacts[0].size_in_bytes
    }
  }
}
