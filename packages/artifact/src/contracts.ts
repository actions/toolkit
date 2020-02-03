export interface CreateArtifactResponse {
  containerId: string
  size: number
  signedContent: string
  fileContainerResourceUrl: string
  type: string
  name: string
  url: string
}

export interface CreateArtifactParameters {
  Type: string
  Name: string
}

export interface PatchArtifactSize {
  Size: number
}

export interface UploadResults {
  size: number
  failedItems: string[]
}
