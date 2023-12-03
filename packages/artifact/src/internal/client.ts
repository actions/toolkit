import {warning} from '@actions/core'
import {isGhes} from './shared/config'
import {
  UploadArtifactOptions,
  UploadArtifactResponse,
  DownloadArtifactOptions,
  GetArtifactResponse,
  ListArtifactsOptions,
  ListArtifactsResponse,
  DownloadArtifactResponse,
  FindOptions
} from './shared/interfaces'
import {uploadArtifact} from './upload/upload-artifact'
import {
  downloadArtifactPublic,
  downloadArtifactInternal
} from './download/download-artifact'
import {getArtifactPublic, getArtifactInternal} from './find/get-artifact'
import {listArtifactsPublic, listArtifactsInternal} from './find/list-artifacts'

export interface ArtifactClient {
  /**
   * Uploads an artifact
   *
   * @param name The name of the artifact, required
   * @param files A list of absolute or relative paths that denote what files should be uploaded
   * @param rootDirectory An absolute or relative file path that denotes the root parent directory of the files being uploaded
   * @param options Extra options for customizing the upload behavior
   * @returns single UploadArtifactResponse object
   */
  uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadArtifactOptions
  ): Promise<UploadArtifactResponse>

  /**
   * Lists all artifacts that are part of the current workflow run.
   * This function will return at most 1000 artifacts per workflow run.
   *
   * If options.findBy is specified, this will call the public List-Artifacts API which can list from other runs.
   * https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts
   *
   * @param options Extra options that allow for the customization of the list behavior
   * @returns ListArtifactResponse object
   */
  listArtifacts(
    options?: ListArtifactsOptions & FindOptions
  ): Promise<ListArtifactsResponse>

  /**
   * Finds an artifact by name.
   *
   * If options.findBy is specified, this will use the public List Artifacts API with a name filter which can get artifacts from other runs.
   * https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts
   * @actions/artifact > 2.0.0 does not allow for creating multiple artifacts with the same name in the same workflow run.
   * It is possible to have multiple artifacts with the same name in the same workflow run by using old versions of upload-artifact (v1,v2 and v3), @actions/artifact < v2.0.0 or it is a rerun.
   * If there are multiple artifacts with the same name in the same workflow run this function will return the first artifact that matches the name.
   *
   * @param artifactName The name of the artifact to find
   * @param options Extra options that allow for the customization of the get behavior
   */
  getArtifact(
    artifactName: string,
    options?: FindOptions
  ): Promise<GetArtifactResponse>

  /**
   * Downloads an artifact and unzips the content.
   *
   * If options.findBy is specified, this will use the public Download Artifact API https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#download-an-artifact
   *
   * @param artifactId The name of the artifact to download
   * @param options Extra options that allow for the customization of the download behavior
   * @returns single DownloadArtifactResponse object
   */
  downloadArtifact(
    artifactId: number,
    options?: DownloadArtifactOptions & FindOptions
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
    options?: UploadArtifactOptions
  ): Promise<UploadArtifactResponse> {
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
    } catch (error) {
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
    options?: DownloadArtifactOptions & FindOptions
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
      if (options?.findBy) {
        const {
          findBy: {repositoryOwner, repositoryName, token},
          ...downloadOptions
        } = options

        return downloadArtifactPublic(
          artifactId,
          repositoryOwner,
          repositoryName,
          token,
          downloadOptions
        )
      }

      return downloadArtifactInternal(artifactId, options)
    } catch (error) {
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
    options?: ListArtifactsOptions & FindOptions
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
      if (options?.findBy) {
        const {
          findBy: {workflowRunId, repositoryOwner, repositoryName, token}
        } = options

        return listArtifactsPublic(
          workflowRunId,
          repositoryOwner,
          repositoryName,
          token,
          options?.latest
        )
      }

      return listArtifactsInternal(options?.latest)
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
    options?: FindOptions
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
      if (options?.findBy) {
        const {
          findBy: {workflowRunId, repositoryOwner, repositoryName, token}
        } = options

        return getArtifactPublic(
          artifactName,
          workflowRunId,
          repositoryOwner,
          repositoryName,
          token
        )
      }

      return getArtifactInternal(artifactName)
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
