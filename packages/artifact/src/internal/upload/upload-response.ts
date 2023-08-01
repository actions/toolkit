export interface UploadResponse {
    /**
     * The name of the artifact that was uploaded
     */
    artifactName: string
  
    /**
     * Total size of the artifact that was uploaded in bytes
     */
    size: number
  }