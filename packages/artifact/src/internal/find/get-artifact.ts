import {GetArtifactResponse} from '../shared/interfaces'
import {getOctokit} from '@actions/github'
import {getUserAgentString} from '../shared/user-agent'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import {RetryOptions, getRetryOptions} from './retry-options'
import {RequestRequestOptions} from '@octokit/types'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'

type Options = {
  log?: Console
  userAgent?: string
  previews?: string[]
  retry?: RetryOptions
  request?: RequestRequestOptions
}

const maxRetryNumber = 5
const exemptStatusCodes = [400, 401, 403, 404, 422] // https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/index.ts#L14

export async function getArtifact(
  artifactName: string,
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string
): Promise<GetArtifactResponse> {
  const [retryOpts, requestOpts] = getRetryOptions(
    maxRetryNumber,
    exemptStatusCodes,
    defaultGitHubOptions
  )

  const opts: Options = {
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
    return {
      success: false
    }
  }

  if (getArtifactResp.data.artifacts.length === 0) {
    return {
      success: false
    }
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
