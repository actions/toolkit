export interface UploadResponse {
    /**
     * The name of the artifact that was uploaded
     */
    artifactName: string
  
    /**
     * Total size of the artifact in bytes that was uploaded
     */
    size: number

    /**
     * A list of items that were uploaded as part of the artifact
     */
    artifactItems: string[]
  }