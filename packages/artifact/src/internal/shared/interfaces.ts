/**
 * Response from the server when an artifact is uploaded
 */
export interface UploadArtifactResponse {
  /**
   * Total size of the artifact in bytes. Not provided if no artifact was uploaded
   */
  size?: number

  /**
   * The id of the artifact that was created. Not provided if no artifact was uploaded
   * This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
   */
  id?: number

  /**
   * The SHA256 digest of the artifact that was created. Not provided if no artifact was uploaded
   */
  digest?: string
}

/**
 * Options for uploading an artifact
 */
export interface UploadArtifactOptions {
  /**
   * Duration after which artifact will expire in days.
   *
   * By default artifact expires after 90 days:
   * https://docs.github.com/en/actions/configuring-and-managing-workflows/persisting-workflow-data-using-artifacts#downloading-and-deleting-artifacts-after-a-workflow-run-is-complete
   *
   * Use this option to override the default expiry.
   *
   * Min value: 1
   * Max value: 90 unless changed by repository setting
   *
   * If this is set to a greater value than the retention settings allowed, the retention on artifacts
   * will be reduced to match the max value allowed on server, and the upload process will continue. An
   * input of 0 assumes default retention setting.
   */
  retentionDays?: number
  /**
   * The level of compression for Zlib to be applied to the artifact archive.
   * The value can range from 0 to 9:
   * - 0: No compression
   * - 1: Best speed
   * - 6: Default compression (same as GNU Gzip)
   * - 9: Best compression
   * Higher levels will result in better compression, but will take longer to complete.
   * For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
   */
  compressionLevel?: number
}

/**
 * Response from the server when getting an artifact
 */
export interface GetArtifactResponse {
  /**
   * Metadata about the artifact that was found
   */
  artifact: Artifact
}

/**
 * Options for listing artifacts
 */
export interface ListArtifactsOptions {
  /**
   * Filter the workflow run's artifacts to the latest by name
   * In the case of reruns, this can be useful to avoid duplicates
   */
  latest?: boolean
}

/**
 * Response from the server when listing artifacts
 */
export interface ListArtifactsResponse {
  /**
   * A list of artifacts that were found
   */
  artifacts: Artifact[]
}

/**
 * Response from the server when downloading an artifact
 */
export interface DownloadArtifactResponse {
  /**
   * The path where the artifact was downloaded to
   */
  downloadPath?: string

  /**
   * Returns true if the digest of the downloaded artifact does not match the expected hash
   */
  digestMismatch?: boolean
}

/**
 * Options for downloading an artifact
 */
export interface DownloadArtifactOptions {
  /**
   * Denotes where the artifact will be downloaded to. If not specified then the artifact is download to GITHUB_WORKSPACE
   */
  path?: string

  /**
   * The hash that was computed for the artifact during upload. Don't provide this unless you want to verify the hash.
   * If the hash doesn't match, the download will fail.
   */
  expectedHash?: string
}

export interface StreamExtractResponse {
  /**
   * The SHA256 hash of the downloaded file
   */
  sha256Digest?: string
}

/**
 * An Actions Artifact
 */
export interface Artifact {
  /**
   * The name of the artifact
   */
  name: string

  /**
   * The ID of the artifact
   */
  id: number

  /**
   * The size of the artifact in bytes
   */
  size: number

  /**
   * The time when the artifact was created
   */
  createdAt?: Date

  /**
   * The digest of the artifact, computed at time of upload.
   */
  digest?: string
}

// FindOptions are for fetching Artifact(s) out of the scope of the current run.
export interface FindOptions {
  /**
   * The criteria for finding Artifact(s) out of the scope of the current run.
   */
  findBy?: {
    /**
     * Token with actions:read permissions
     */
    token: string
    /**
     * WorkflowRun of the artifact(s) to lookup
     */
    workflowRunId: number
    /**
     * Repository owner (eg. 'actions')
     */
    repositoryOwner: string
    /**
     * Repository owner (eg. 'toolkit')
     */
    repositoryName: string
  }
}

/**
 * Response from the server when deleting an artifact
 */
export interface DeleteArtifactResponse {
  /**
   * The id of the artifact that was deleted
   */
  id: number
}
