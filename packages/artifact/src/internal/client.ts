import {UploadOptions} from './upload/upload-options'
import {UploadResponse} from './upload/upload-response'
import {uploadArtifact} from './upload/upload-artifact'
import {warning} from '@actions/core'
import {isGhes} from './shared/config'

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
    if (isGhes()) {
      warning(
        `@actions/artifact v2 and upload-artifact v4 are not currently supported on GHES.`
      )
      return {
        success: false
      }
    }

    try {
      return uploadArtifact(name, files, rootDirectory, options)
    } catch (error) {
      warning(
        `Artifact upload failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug enabled for more information.

If the error persists, please check whether Actions is running normally at [https://githubstatus.com](https://www.githubstatus.com).`
      )
      return {
        success: false
      }
    }
  }
}
