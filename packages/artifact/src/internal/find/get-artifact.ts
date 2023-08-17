import {GetArtifactResponse} from '../shared/interfaces'

export async function getArtifact(
  artifactName: string,
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string
): Promise<GetArtifactResponse> {
  throw new Error('Not implemented')
}
