import {checkArtifactName} from './path-and-artifact-name-validation'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'

export interface ArtifactClient {
  /**
   * Uploads an artifact
   *
   * @param name the name of the artifact, required
   * @param files a list of absolute or relative paths that denote what files should be uploaded
   * @param rootDirectory an absolute or relative file path that denotes the root parent directory of the files being uploaded
   * @param options extra options for customizing the upload behavior
   * @returns single UploadInfo object
   */
  uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions
  ): Promise<UploadResponse>
}

export class DefaultArtifactClient implements ArtifactClient {
  /**
   * Constructs a DefaultArtifactClient
   */
  static create(): DefaultArtifactClient {
    return new DefaultArtifactClient()
  }

  /**
   * Uploads an artifact
   */
  async uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions | undefined
  ): Promise<UploadResponse> {

    // Need to keep checking the artifact name
    checkArtifactName(name)

    // TODO Twirp call to create new artifact

    // TODO Upload to blob storage using SAS URL

    // TODO Twirp call to finalize the new artifact upload

    const uploadResponse: UploadResponse = {
      artifactName: name,
      artifactItems: [],
      size: 0
    }

    return uploadResponse
  }
}