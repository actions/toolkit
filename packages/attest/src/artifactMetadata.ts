import * as github from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import {RequestHeaders} from '@octokit/types'

const CREATE_STORAGE_RECORD_REQUEST = 'POST /orgs/{owner}/artifacts/metadata/storage-record'
const DEFAULT_RETRY_COUNT = 5

/**
 * Options for creating a storage record for an attested artifact.
 */
export type StorageRecordOptions = {
  // Includes details about the attested artifact
  artifactOptions: {
    // The name of the artifact
    name: string
    // The digest of the artifact
    digest: string
    // The version of the artifact
    version?: string
    // The status of the artifact
    status?: string
  },
  // Includes details about the package registry the artifact was published to
  packageRegistryOptions: {
    // The URL of the package registry
    registryUrl: string
    // The URL of the artifact in the package registry
    artifactUrl?: string
    // The package registry repository the artifact was published to.
    repo?: string
    // The path of the artifact in the package registry repository.
    path?: string
  },
  // GitHub token for writing attestations.
  token: string
  // Optional parameters for the write operation.
  writeOptions: {
    // The number of times to retry the request.
    retry?: number
  // HTTP headers to include in request to Artifact Metadata API.
    headers?: RequestHeaders
  }
}

/**
 * Writes a storage record on behalf of an artifact that has been attested
 * @param StorageRecordOptions - parameters for the storage record API request.
 * @returns The ID of the storage record.
 * @throws Error if the storage record fails to persist.
 */
export async function createStorageRecord(options: StorageRecordOptions): Promise<Array<string>> {
  const retries = options.writeOptions.retry ?? DEFAULT_RETRY_COUNT
  const octokit = github.getOctokit(options.token, {retry: {retries}}, retry)

  try {
    const response = await octokit.request(CREATE_STORAGE_RECORD_REQUEST, {
      owner: github.context.repo.owner,
      headers: options.writeOptions.headers,
      ...buildRequestParams(options),
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

const buildRequestParams = (options: StorageRecordOptions) => {
  const { registryUrl, artifactUrl, ...rest } = options.packageRegistryOptions
  return {
    ...options.artifactOptions,
    registry_url: registryUrl,
    artifact_url: artifactUrl,
    ...rest,
  }
}
