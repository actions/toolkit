import { ArtifactClient, Client} from './internal/client'
import { UploadOptions } from './internal/upload/upload-options'
import { UploadResponse } from './internal/upload/upload-response'

/**
 * Exported functionality that we want to expose for any users of @actions/artifact
 */
export {
  ArtifactClient,
  UploadOptions,
  UploadResponse,
}

export function create(): ArtifactClient {
  return Client.create()
}