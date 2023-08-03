import {UploadOptions} from './upload/upload-options'
import {UploadResponse} from './upload/upload-response'
import {uploadArtifact} from './upload/upload-artifact'

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

  // TODO Download functionality
}

export class Client implements ArtifactClient {
  /**
   * Constructs a Client
   */
  static create(): Client {
    return new Client()
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
    return uploadArtifact(name, files, rootDirectory, options)
  }
}
