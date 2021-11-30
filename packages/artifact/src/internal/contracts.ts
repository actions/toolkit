export interface ArtifactResponse {
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
  RetentionDays?: number
}

export interface PatchArtifactSize {
  Size: number
}

export interface PatchArtifactSizeSuccessResponse {
  containerId: number
  size: number
  signedContent: string
  type: string
  name: string
  url: string
  uploadUrl: string
}

export interface UploadResults {
  /**
   * The size in bytes of data that was transferred during the upload process to the actions backend service. This takes into account possible
   * gzip compression to reduce the amount of data that needs to be transferred
   */
  uploadSize: number

  /**
   * The raw size of the files that were specified for upload
   */
  totalSize: number

  /**
   * An array of files that failed to upload
   */
  failedItems: string[]
}

export interface ListArtifactsResponse {
  count: number
  value: ArtifactResponse[]
}

export interface QueryArtifactResponse {
  count: number
  value: ContainerEntry[]
}

export interface ContainerEntry {
  containerId: number
  scopeIdentifier: string
  path: string
  itemType: string
  status: string
  fileLength?: number
  fileEncoding?: number
  fileType?: number
  dateCreated: string
  dateLastModified: string
  createdBy: string
  lastModifiedBy: string
  itemLocation: string
  contentLocation: string
  fileId?: number
  contentId: string
}
