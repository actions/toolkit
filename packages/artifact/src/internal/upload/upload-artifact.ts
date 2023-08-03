import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'

export async function uploadArtifact(
  name: string,
  files: string[], // eslint-disable-line @typescript-eslint/no-unused-vars
  rootDirectory: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  options?: UploadOptions | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<UploadResponse> {
  // TODO - Implement upload functionality

  const uploadResponse: UploadResponse = {
    artifactName: name,
    size: 0
  }

  return uploadResponse
}
