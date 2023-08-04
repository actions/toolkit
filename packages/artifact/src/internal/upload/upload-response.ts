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
