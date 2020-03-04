import * as core from '@actions/core'
import {
  UploadSpecification,
  getUploadSpecification
} from './internal-upload-specification'
import {UploadHttpClient} from './internal-upload-http-client'
import {UploadResponse} from './internal-upload-response'
import {UploadOptions} from './internal-upload-options'
import {DownloadOptions} from './internal-download-options'
import {DownloadResponse} from './internal-download-response'
import {checkArtifactName, createDirectoriesForArtifact} from './internal-utils'
import {DownloadHttpClient} from './internal-download-http-client'
import {getDownloadSpecification} from './internal-download-specification'
import {
  getWorkSpaceDirectory,
  getDownloadArtifactConcurrency
} from './internal-config-variables'
import {normalize, resolve} from 'path'

export {UploadResponse, UploadOptions, DownloadResponse, DownloadOptions}

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

  /**
   * Downloads a single artifact associated with a run
   *
   * @param name the name of the artifact being downloaded
   * @param path optional path that denotes where the artifact will be downloaded to
   * @param options extra options that allow for the customization of the download behavior
   */
  downloadArtifact(
    name: string,
    path?: string,
    options?: DownloadOptions
  ): Promise<DownloadResponse>

  /**
   * Downloads all artifacts associated with a run. Because there are multiple artifacts being downloaded, a folder will be created for each one in the specified or default directory
   * @param path optional path that denotes where the artifacts will be downloaded to
   */
  downloadAllArtifacts(path?: string): Promise<DownloadResponse[]>
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
    checkArtifactName(name)

    // Get specification for the files being uploaded
    const uploadSpecification: UploadSpecification[] = getUploadSpecification(
      name,
      rootDirectory,
      files
    )
    const uploadResponse: UploadResponse = {
      artifactName: name,
      artifactItems: [],
      size: 0,
      failedItems: []
    }

    const uploadHttpClient = new UploadHttpClient()

    if (uploadSpecification.length === 0) {
      core.warning(`No files found that can be uploaded`)
    } else {
      // Create an entry for the artifact in the file container
      const response = await uploadHttpClient.createArtifactInFileContainer(
        name
      )
      if (!response.fileContainerResourceUrl) {
        core.debug(response.toString())
        throw new Error(
          'No URL provided by the Artifact Service to upload an artifact to'
        )
      }
      core.debug(`Upload Resource URL: ${response.fileContainerResourceUrl}`)

      // Upload each of the files that were found concurrently
      const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
        response.fileContainerResourceUrl,
        uploadSpecification,
        options
      )

      // Update the size of the artifact to indicate we are done uploading
      // The uncompressed size is used for display when downloading a zip of the artifact from the UI
      await uploadHttpClient.patchArtifactSize(
        uploadResult.uncompressedSize,
        name
      )

      core.info(
        `Finished uploading artifact ${name}. Reported size is ${uploadResult.uploadSize} bytes. There were ${uploadResult.failedItems.length} items that failed to upload`
      )

      uploadResponse.artifactItems = uploadSpecification.map(
        item => item.absoluteFilePath
      )
      uploadResponse.size = uploadResult.uploadSize
      uploadResponse.failedItems = uploadResult.failedItems
    }
    return uploadResponse
  }

  async downloadArtifact(
    name: string,
    path?: string | undefined,
    options?: DownloadOptions | undefined
  ): Promise<DownloadResponse> {
    const downloadHttpClient = new DownloadHttpClient()

    const artifacts = await downloadHttpClient.listArtifacts()
    if (artifacts.count === 0) {
      throw new Error(
        `Unable to find any artifacts for the associated workflow`
      )
    }

    const artifactToDownload = artifacts.value.find(artifact => {
      return artifact.name === name
    })
    if (!artifactToDownload) {
      throw new Error(`Unable to find an artifact with the name: ${name}`)
    }

    const items = await downloadHttpClient.getContainerItems(
      artifactToDownload.name,
      artifactToDownload.fileContainerResourceUrl
    )

    if (!path) {
      path = getWorkSpaceDirectory()
    }
    path = normalize(path)
    path = resolve(path)

    // During upload, empty directories are rejected by the remote server so there should be no artifacts that consist of only empty directories
    const downloadSpecification = getDownloadSpecification(
      name,
      items.value,
      path,
      options?.createArtifactFolder || false
    )

    if (downloadSpecification.filesToDownload.length === 0) {
      core.info(
        `No downloadable files were found for the artifact: ${artifactToDownload.name}`
      )
    } else {
      // Create all necessary directories recursively before starting any download
      await createDirectoriesForArtifact(
        downloadSpecification.directoryStructure
      )
      await downloadHttpClient.downloadSingleArtifact(
        downloadSpecification.filesToDownload
      )
    }

    return {
      artifactName: name,
      downloadPath: downloadSpecification.rootDownloadLocation
    }
  }

  async downloadAllArtifacts(
    path?: string | undefined
  ): Promise<DownloadResponse[]> {
    const downloadHttpClient = new DownloadHttpClient()

    const response: DownloadResponse[] = []
    const artifacts = await downloadHttpClient.listArtifacts()
    if (artifacts.count === 0) {
      core.info('Unable to find any artifacts for the associated workflow')
      return response
    }

    if (!path) {
      path = getWorkSpaceDirectory()
    }
    path = normalize(path)
    path = resolve(path)

    const ARTIFACT_CONCURRENCY = getDownloadArtifactConcurrency()
    const parallelDownloads = [...new Array(ARTIFACT_CONCURRENCY).keys()]
    let downloadedArtifacts = 0
    await Promise.all(
      parallelDownloads.map(async () => {
        while (downloadedArtifacts < artifacts.count) {
          const currentArtifactToDownload = artifacts.value[downloadedArtifacts]
          downloadedArtifacts += 1

          // Get container entries for the specific artifact
          const items = await downloadHttpClient.getContainerItems(
            currentArtifactToDownload.name,
            currentArtifactToDownload.fileContainerResourceUrl
          )

          // Promise.All is not correctly inferring that 'path' is no longer possibly undefined: https://github.com/microsoft/TypeScript/issues/34925
          const downloadSpecification = getDownloadSpecification(
            currentArtifactToDownload.name,
            items.value,
            path!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
            true
          )
          if (downloadSpecification.filesToDownload.length === 0) {
            core.info(
              `No downloadable files were found for any artifact ${currentArtifactToDownload.name}`
            )
          } else {
            await createDirectoriesForArtifact(
              downloadSpecification.directoryStructure
            )
            await downloadHttpClient.downloadSingleArtifact(
              downloadSpecification.filesToDownload
            )
          }

          response.push({
            artifactName: currentArtifactToDownload.name,
            downloadPath: downloadSpecification.rootDownloadLocation
          })
        }
      })
    )
    return response
  }
}
