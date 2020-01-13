export interface UploadInfo {
  /**
   * The name of the artifact that was uploaded
   */
  artifactName: string

  /**
   * A list of items that were uploaded as part of the artifact
   */
  artifactItems: string[]

  /**
   * Total size of the artifact in bytes that was uploaded
   */
  size: number
}
