/*****************************************************************************
 *                                                                           *
 *                            UploadArtifact                                 *
 *                                                                           *
 *****************************************************************************/
export interface UploadResponse {
  /**
   * Denotes if an artifact was successfully uploaded
   */
  success: boolean

  /**
   * Total size of the artifact in bytes. Not provided if no artifact was uploaded
   */
  size?: number

  /**
   * The id of the artifact that was created. Not provided if no artifact was uploaded
   * This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts
   */
  id?: number
}

export interface UploadOptions {
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

/*****************************************************************************
 *                                                                           *
 *                              GetArtifact                                  *
 *                                                                           *
 *****************************************************************************/

export interface GetArtifactResponse {
  /**
   * If an artifact was found
   */
  success: boolean

  /**
   * Metadata about the artifact that was found
   */
  artifact?: Artifact
}

/*****************************************************************************
 *                                                                           *
 *                             ListArtifact                                  *
 *                                                                           *
 *****************************************************************************/

export interface ListArtifactsOptions {
  /**
   * Filter the workflow run's artifacts to the latest by name
   * In the case of reruns, this can be useful to avoid duplicates
   */
  latest?: boolean
}

export interface ListArtifactsResponse {
  /**
   * A list of artifacts that were found
   */
  artifacts: Artifact[]
}

/*****************************************************************************
 *                                                                           *
 *                           DownloadArtifact                                *
 *                                                                           *
 *****************************************************************************/
export interface DownloadArtifactResponse {
  /**
   * If the artifact download was successful
   */
  success: boolean
  /**
   * The path where the artifact was downloaded to
   */
  downloadPath?: string
}

export interface DownloadArtifactOptions {
  /**
   * Denotes where the artifact will be downloaded to. If not specified then the artifact is download to GITHUB_WORKSPACE
   */
  path?: string
}

/*****************************************************************************
 *                                                                           *
 *                                 Shared                                    *
 *                                                                           *
 *****************************************************************************/
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
}

// FindOptions are for fetching Artifact(s) out of the scope of the current run.
// Must specify a PAT with actions:read scope for cross run/repo lookup otherwise these will be ignored.
export interface FindOptions {
  findBy?: {
    // Token with actions:read permissions
    token: string
    // WorkflowRun of the artifact(s) to lookup
    workflowRunId: number
    // Repository owner
    repositoryOwner: string
    // Repository name
    repositoryName: string
  }
}
