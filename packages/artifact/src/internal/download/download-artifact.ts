import {
  DownloadSingleArtifactOptions,
  DownloadArtifactResponse
} from '../shared/interfaces'

export async function downloadArtifact(
  artifactId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string,
  options?: DownloadSingleArtifactOptions
): Promise<DownloadArtifactResponse> {
  throw new Error('Not implemented')
}
