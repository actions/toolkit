export interface UploadResponse {
  /**
   * The name of the artifact that was uploaded
   */
  artifactName: string

  /**
   * A list of all items that are meant to be uploaded as part of the artifact
   */
  artifactItems: string[]

  /**
   * Total size of the artifact in bytes that was uploaded
   */
  size: number

  /**
   * A list of items that were not uploaded as part of the artifact (includes queued items that were not uploaded if
   * continueOnError is set to false). This is a subset of artifactItems.
   */
  failedItems: string[]
}
