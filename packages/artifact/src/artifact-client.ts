import {ArtifactClient, DefaultArtifactClient} from './internal-artifact-client'
export {ArtifactClient}

/**
 * Constructs an ArtifactClient
 */
export function create(): ArtifactClient {
  return DefaultArtifactClient.create()
}
