import {ArtifactClient, Client} from './internal/client'

/**
 * Exported functionality that we want to expose for any users of @actions/artifact
 */
export * from './internal/shared/interfaces'
export {ArtifactClient}

export function create(): ArtifactClient {
  return Client.create()
}