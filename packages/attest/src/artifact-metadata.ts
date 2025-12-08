import * as github from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import {RequestHeaders} from '@octokit/types'

const CREATE_STORAGE_RECORD_REQUEST = 'POST /orgs/{owner}/artifacts/metadata/storage-record'
const DEFAULT_RETRY_COUNT = 5

export type WriteOptions = {
  retry?: number
  headers?: RequestHeaders
}

/**
 * Writes a storage record on behalf of an artifact
 * @param artifactName - The name of the artifact.
 * @param artifactDigest - The digest of the artifact.
 * @param token - The GitHub token for authentication.
 * @returns The ID of the storage record.
 * @throws Error if the storage record fails to persist.
 */
export const createStorageRecord = async (
  artifactName: string,
  artifactDigest: string,
  token: string,
  options: WriteOptions = {}
): Promise<string> => {
  const retries = options.retry ?? DEFAULT_RETRY_COUNT
  const octokit = github.getOctokit(token, {retry: {retries}}, retry)

  try {
    const response = await octokit.request(CREATE_STORAGE_RECORD_REQUEST, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      headers: options.headers,
      artifact_name: artifactName,
      artifact_digest: artifactDigest,
    })

    const data =
      typeof response.data == 'string'
        ? JSON.parse(response.data)
        : response.data
    return data?.id
  } catch (err) {
    const message = err instanceof Error ? err.message : err
    throw new Error(`Failed to persist storage record: ${message}`)
  }
}
