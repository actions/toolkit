import {info, warning, debug} from '@actions/core'
import {getOctokit} from '@actions/github'
import {ListArtifactsResponse, Artifact} from '../shared/interfaces'
import {getUserAgentString} from '../shared/user-agent'
import {RetryOptions, getRetryOptions} from './retry-options'
import {defaults as defaultGitHubOptions} from '@actions/github/lib/utils'
import {requestLog} from '@octokit/plugin-request-log'
import {retry} from '@octokit/plugin-retry'
import {RequestRequestOptions} from '@octokit/types'

type Options = {
  log?: Console
  userAgent?: string
  previews?: string[]
  retry?: RetryOptions
  request?: RequestRequestOptions
}

// Limiting to 1000 for perf reasons
const maximumArtifactCount = 1000
const paginationCount = 100
const maxNumberOfPages = maximumArtifactCount / paginationCount
const maxRetryNumber = 5
const exemptStatusCodes = [400, 401, 403, 404, 422] // https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/index.ts#L14

export async function listArtifacts(
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string
): Promise<ListArtifactsResponse> {
  info(`Fetching artifact list for workflow run ${workflowRunId} in repository ${repositoryOwner}\\${repositoryName}`)

  const artifacts: Artifact[] = []
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

  let currentPageNumber = 1
  const {data: listArtifactResponse} =
    await github.rest.actions.listWorkflowRunArtifacts({
      owner: repositoryOwner,
      repo: repositoryName,
      run_id: workflowRunId,
      per_page: paginationCount,
      page: currentPageNumber
    })

  let numberOfPages = Math.ceil(
    listArtifactResponse.total_count / paginationCount
  )
  const totalArtifactCount = listArtifactResponse.total_count
  if (totalArtifactCount > maximumArtifactCount) {
    warning(
      `Workflow run ${workflowRunId} has more than 1000 artifacts. Results will be incomplete as only the first ${maximumArtifactCount} artifacts will be returned`
    )
    numberOfPages = maxNumberOfPages
  }

  // Iterate over the first page
  listArtifactResponse.artifacts.forEach(artifact => {
    artifacts.push({
      artifactName: artifact.name,
      artifactId: artifact.id,
      url: artifact.url,
      size: artifact.size_in_bytes
    })
  })

  // Iterate over any remaining pages
  for (
    currentPageNumber;
    currentPageNumber < numberOfPages;
    currentPageNumber++
  ) {
    currentPageNumber++
    debug(`Fetching page ${currentPageNumber} of artifact list`)

    const {data: listArtifactResponse} =
      await github.rest.actions.listWorkflowRunArtifacts({
        owner: repositoryOwner,
        repo: repositoryName,
        run_id: workflowRunId,
        per_page: paginationCount,
        page: currentPageNumber
      })

    listArtifactResponse.artifacts.forEach(artifact => {
      artifacts.push({
        artifactName: artifact.name,
        artifactId: artifact.id,
        url: artifact.url,
        size: artifact.size_in_bytes
      })
    })
  }

  info(`Finished fetching artifact list`)

  return {
    artifacts: artifacts
  }
}
