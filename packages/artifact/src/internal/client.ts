import {warning} from '@actions/core'
import {isGhes} from './shared/config'
import {
  UploadOptions,
  UploadResponse,
  DownloadArtifactOptions,
  GetArtifactResponse,
  ListArtifactsResponse,
  DownloadArtifactResponse
} from './shared/interfaces'
import {uploadArtifact} from './upload/upload-artifact'
import {downloadArtifact} from './download/download-artifact'
import {getArtifact} from './find/get-artifact'
import {listArtifacts} from './find/list-artifacts'

export interface ArtifactClient {
  /**
   * Uploads an artifact
   *
   * @param name The name of the artifact, required
   * @param files A list of absolute or relative paths that denote what files should be uploaded
   * @param rootDirectory An absolute or relative file path that denotes the root parent directory of the files being uploaded
   * @param options Extra options for customizing the upload behavior
   * @returns single UploadResponse object
   */
  uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions
  ): Promise<UploadResponse>

  /**
   * Lists all artifacts that are part of a workflow run.
   *
   * This calls the public List-Artifacts API https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts
   * Due to paginated responses from the public API. This function will return at most 1000 artifacts per workflow run (100 per page * maximum 10 calls)
   *
   * @param workflowRunId The workflow run id that the artifact belongs to
   * @param repositoryOwner The owner of the repository that the artifact belongs to
   * @param repositoryName The name of the repository that the artifact belongs to
   * @param token A token with the appropriate permission to the repository to list artifacts
   * @returns ListArtifactResponse object
   */
  listArtifacts(
    workflowRunId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string
  ): Promise<ListArtifactsResponse>

  /**
   * Finds an artifact by name given a repository and workflow run id.
   *
   * This calls the public List-Artifacts API with a name filter https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts
   * @actions/artifact > 2.0.0 does not allow for creating multiple artifacts with the same name in the same workflow run.
   * It is possible to have multiple artifacts with the same name in the same workflow run by using old versions of upload-artifact (v1,v2 and v3) or @actions/artifact < v2.0.0
   * If there are multiple artifacts with the same name in the same workflow run this function will return the first artifact that matches the name.
   *
   * @param artifactName The name of the artifact to find
   * @param workflowRunId The workflow run id that the artifact belongs to
   * @param repositoryOwner The owner of the repository that the artifact belongs to
   * @param repositoryName The name of the repository that the artifact belongs to
   * @param token A token with the appropriate permission to the repository to find the artifact
   */
  getArtifact(
    artifactName: string,
    workflowRunId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string
  ): Promise<GetArtifactResponse>

  /**
   * Downloads an artifact and unzips the content
   *
   * @param artifactId The name of the artifact to download
   * @param repositoryOwner The owner of the repository that the artifact belongs to
   * @param repositoryName The name of the repository that the artifact belongs to
   * @param token A token with the appropriate permission to the repository to download the artifact
   * @param options Extra options that allow for the customization of the download behavior
   * @returns single DownloadArtifactResponse object
   */
  downloadArtifact(
    artifactId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string,
    options?: DownloadArtifactOptions
  ): Promise<DownloadArtifactResponse>
}

export class Client implements ArtifactClient {
  /**
   * Constructs a Client
   */
  static create(): Client {
    return new Client()
  }

  /**
   * Upload Artifact
   */
  async uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions | undefined
  ): Promise<UploadResponse> {
    if (isGhes()) {
      warning(
        `@actions/artifact v2.0.0+ and upload-artifact@v4+ are not currently supported on GHES.`
      )
      return {
        success: false
      }
    }

    try {
      return uploadArtifact(name, files, rootDirectory, options)
    } catch (error: any) {
      warning(
        `Artifact upload failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug mode enabled for more information.

If the error persists, please check whether Actions is operating normally at [https://githubstatus.com](https://www.githubstatus.com).`
      )
      return {
        success: false
      }
    }
  }

  /**
   * Download Artifact
   */
  async downloadArtifact(
    artifactId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string,
    options?: DownloadArtifactOptions
  ): Promise<DownloadArtifactResponse> {
    if (isGhes()) {
      warning(
        `@actions/artifact v2.0.0+ and download-artifact@v4+ are not currently supported on GHES.`
      )
      return {
        success: false
      }
    }

    try {
      return downloadArtifact(
        artifactId,
        repositoryOwner,
        repositoryName,
        token,
        options
      )
    } catch (error: any) {
      warning(
        `Artifact download failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug mode enabled for more information.

If the error persists, please check whether Actions and API requests are operating normally at [https://githubstatus.com](https://www.githubstatus.com).`
      )

      return {
        success: false
      }
    }
  }

  /**
   * List Artifacts
   */
  async listArtifacts(
    workflowRunId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string
  ): Promise<ListArtifactsResponse> {
    if (isGhes()) {
      warning(
        `@actions/artifact v2.0.0+ and download-artifact@v4+ are not currently supported on GHES.`
      )
      return {
        artifacts: []
      }
    }

    try {
      return listArtifacts(
        workflowRunId,
        repositoryOwner,
        repositoryName,
        token
      )
    } catch (error: unknown) {
      warning(
        `Listing Artifacts failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug mode enabled for more information.

If the error persists, please check whether Actions and API requests are operating normally at [https://githubstatus.com](https://www.githubstatus.com).`
      )

      return {
        artifacts: []
      }
    }
  }

  /**
   * Get Artifact
   */
  async getArtifact(
    artifactName: string,
    workflowRunId: number,
    repositoryOwner: string,
    repositoryName: string,
    token: string
  ): Promise<GetArtifactResponse> {
    if (isGhes()) {
      warning(
        `@actions/artifact v2.0.0+ and download-artifact@v4+ are not currently supported on GHES.`
      )
      return {
        success: false
      }
    }

    try {
      return getArtifact(
        artifactName,
        workflowRunId,
        repositoryOwner,
        repositoryName,
        token
      )
    } catch (error: unknown) {
      warning(
        `Fetching Artifact failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug mode enabled for more information.

If the error persists, please check whether Actions and API requests are operating normally at [https://githubstatus.com](https://www.githubstatus.com).`
      )
      return {
        success: false
      }
    }
  }
}
