import {ArtifactClient, DefaultArtifactClient} from './internal/client'

export * from './internal/shared/interfaces'
export * from './internal/shared/errors'
export * from './internal/client'

const client: ArtifactClient = new DefaultArtifactClient()
export default client
