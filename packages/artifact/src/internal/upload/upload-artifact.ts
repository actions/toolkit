import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'

export async function uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions | undefined
  ): Promise<UploadResponse> {

    // TODO - Implement upload functionality

    const uploadResponse: UploadResponse = {
        artifactName: name,
        size: 0
    }

    return uploadResponse
}