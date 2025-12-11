import * as github from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import {RequestHeaders} from '@octokit/types'

const CREATE_STORAGE_RECORD_REQUEST =
  'POST /orgs/{owner}/artifacts/metadata/storage-record'
const DEFAULT_RETRY_COUNT = 5

/**
 * Options for creating a storage record for an attested artifact.
 */
export type ArtifactOptions = {
  // Includes details about the attested artifact
  // The name of the artifact
  name: string
  // The digest of the artifact
  digest: string
  // The version of the artifact
  version?: string
  // The status of the artifact
  status?: string
}
// Includes details about the package registry the artifact was published to
export type PackageRegistryOptions = {
  // The URL of the package registry
  registryUrl: string
  // The URL of the artifact in the package registry
  artifactUrl?: string
  // The package registry repository the artifact was published to.
  repo?: string
  // The path of the artifact in the package registry repository.
  path?: string
}

/**
 * Writes a storage record on behalf of an artifact that has been attested
 * @param artifactOptions - parameters for the storage record API request.
 * @param packageRegistryOptions - parameters for the package registry API request.
 * @param token - GitHub token used to authenticate the request.
 * @param retryAttempts - The number of retries to attempt if the request fails.
 * @param headers - Additional headers to include in the request.
 *
 * @returns The ID of the storage record.
 * @throws Error if the storage record fails to persist.
 */
export async function createStorageRecord(
  artifactOptions: ArtifactOptions,
  packageRegistryOptions: PackageRegistryOptions,
  token: string,
  retryAttempts?: number,
  headers?: RequestHeaders
): Promise<number[]> {
  const retries = retryAttempts ?? DEFAULT_RETRY_COUNT
  const octokit = github.getOctokit(token, {retry: {retries}}, retry)
  try {
    const response = await octokit.request(CREATE_STORAGE_RECORD_REQUEST, {
      owner: github.context.repo.owner,
      headers,
      ...buildRequestParams(artifactOptions, packageRegistryOptions)
    })

    const data =
      typeof response.data == 'string'
        ? JSON.parse(response.data)
        : response.data

    return data?.storage_records.map((r: {id: number}) => r.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : err
    throw new Error(`Failed to persist storage record: ${message}`)
  }
}

function buildRequestParams(
  artifactOptions: ArtifactOptions,
  packageRegistryOptions: PackageRegistryOptions
): Record<string, unknown> {
  const {registryUrl, artifactUrl, ...rest} = packageRegistryOptions
  return {
    ...artifactOptions,
    registry_url: registryUrl,
    artifact_url: artifactUrl,
    ...rest
  }
}
