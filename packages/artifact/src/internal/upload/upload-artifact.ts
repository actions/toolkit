
import {checkArtifactName} from './path-and-artifact-name-validation'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'

export async function uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions | undefined
  ): Promise<UploadResponse> {

    // Need to keep checking the artifact name
    checkArtifactName(name)

    // TODO Twirp call to create new artifact

    // TODO Upload to blob storage using SAS URL
    // testing.ts is being used to prototype this functionality

    // TODO Twirp call to finalize the new artifact upload

    const uploadResponse: UploadResponse = {
      artifactName: name,
      size: 0
    }

    return uploadResponse
}