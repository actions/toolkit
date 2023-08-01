import { ArtifactClient, DefaultArtifactClient} from './internal/artifact-client'
import { UploadOptions } from './internal/upload-options'
import { UploadResponse } from './internal/upload-response'

/**
 * Exported functionality that we want to expose for any users of @actions/artifact
 */
export {
  ArtifactClient,
  UploadOptions,
  UploadResponse,
}

export function create(): ArtifactClient {
  return DefaultArtifactClient.create()
}
