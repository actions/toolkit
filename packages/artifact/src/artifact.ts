import {ArtifactClient, DefaultArtifactClient} from './internal/client.js'

export * from './internal/shared/interfaces.js'
export * from './internal/shared/errors.js'
export * from './internal/client.js'

const client: ArtifactClient = new DefaultArtifactClient()
export default client
