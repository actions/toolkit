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
   * Metadata about the artifact that was downloaded
   */
  artifact?: Artifact
}

export interface DownloadArtifactOptions {
  /**
   * Denotes where the artifact will be downloaded to. If not specified then the artifact is download to GITHUB_WORKSPACE
   */
  path?: string

  /**
   * Specifies if a root folder with the artifact name is created for the artifact that is downloaded
   * Zip contents are expanded into this folder. Defaults to false if not specified
   * */
  createArtifactFolder?: boolean
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
  artifactName: string

  /**
   * The ID of the artifact
   */
  artifactId: number

  /**
   * The URL of the artifact
   */
  url: string

  /**
   * The size of the artifact in bytes
   */
  size: number
}
