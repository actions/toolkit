import {
  DownloadArtifactOptions,
  DownloadArtifactResponse
} from '../shared/interfaces'

export async function downloadArtifact(
  artifactId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  throw new Error('Not implemented')
}
