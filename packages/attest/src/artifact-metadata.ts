import * as github from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import {RequestHeaders} from '@octokit/types'

const CREATE_STORAGE_RECORD_REQUEST = 'POST /orgs/{owner}/artifacts/metadata/storage-record'
const DEFAULT_RETRY_COUNT = 5

export type ArtifactParams = {
  name: string
  digest: string
  version?: string
  status?: string
}

export type PackageRegistryParams = {
  registryUrl: string
  artifactUrl?: string
  registryRepo?: string
  path?: string
}

export type WriteOptions = {
  retry?: number
  headers?: RequestHeaders
}

/**
 * Writes a storage record on behalf of an artifact that has been attested
 * @param artifactParams - parameters for the artifact.
 * @param packageRegistryParams - parameters for the package registry.
 * @param token - The GitHub token for authentication.
 * @param options - Optional parameters for the write operation.
 * @returns The ID of the storage record.
 * @throws Error if the storage record fails to persist.
 */
export const createStorageRecord = async (
  artifactParams: ArtifactParams,
  packageRegistryParams: PackageRegistryParams,
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
      artifact_name: artifactParams.name,
      artifact_digest: artifactParams.digest,
      artifact_version: artifactParams.version,
      artifact_status: artifactParams.status,
      registry_url: packageRegistryParams.registryUrl,
      artifact_url: packageRegistryParams.artifactUrl,
      registry_repo: packageRegistryParams.registryRepo,
      path: packageRegistryParams.path
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
