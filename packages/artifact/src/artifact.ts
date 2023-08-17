import {ArtifactClient, Client} from './internal/client'
import {UploadOptions, UploadResponse} from './internal/shared/interfaces'

/**
 * Exported functionality that we want to expose for any users of @actions/artifact
 */
export {ArtifactClient, UploadOptions, UploadResponse}

export function create(): ArtifactClient {
  return Client.create()
}
