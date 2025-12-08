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
  repo?: string
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
export async function createStorageRecord(
  artifactParams: ArtifactParams,
  packageRegistryParams: PackageRegistryParams,
  token: string,
  options: WriteOptions = {}
): Promise<Array<string>> {
  const retries = options.retry ?? DEFAULT_RETRY_COUNT
  const octokit = github.getOctokit(token, {retry: {retries}}, retry)

  try {
    const response = await octokit.request(CREATE_STORAGE_RECORD_REQUEST, {
      owner: github.context.repo.owner,
      headers: options.headers,
      ...buildRequestParams(artifactParams, packageRegistryParams),
    })

    const data =
      typeof response.data == 'string'
        ? JSON.parse(response.data)
        : response.data

    return data?.storage_records.map((r: { id: any }) => r.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : err
    throw new Error(`Failed to persist storage record: ${message}`)
  }
}

const buildRequestParams = (artifactParams: ArtifactParams, registryParams: PackageRegistryParams) => {
  const { registryUrl, artifactUrl, ...rest } = registryParams
  return {
    ...artifactParams,
    ...rest,
    // rename parameters to match API expectations
    artifact_url: artifactUrl,
    registry_url: registryUrl,
  }
}
