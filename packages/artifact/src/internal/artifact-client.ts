import * as core from '@actions/core'
import {
  UploadSpecification,
  getUploadSpecification
} from './upload-specification'
import {UploadHttpClient} from './upload-http-client'
import {UploadResponse} from './upload-response'
import {UploadOptions} from './upload-options'
import {DownloadOptions} from './download-options'
import {DownloadResponse} from './download-response'
import {
  createDirectoriesForArtifact,
  createEmptyFilesForArtifact
} from './utils'
import {checkArtifactName} from './path-and-artifact-name-validation'
import {DownloadHttpClient} from './download-http-client'
import {getDownloadSpecification} from './download-specification'
import {getWorkSpaceDirectory} from './config-variables'
import {normalize, resolve} from 'path'

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
    core.info(
      `Starting artifact upload
For more detailed logs during the artifact upload process, enable step-debugging: https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging#enabling-step-debug-logging`
    )
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
        name,
        options
      )
      if (!response.fileContainerResourceUrl) {
        core.debug(response.toString())
        throw new Error(
          'No URL provided by the Artifact Service to upload an artifact to'
        )
      }

      core.debug(`Upload Resource URL: ${response.fileContainerResourceUrl}`)
      core.info(
        `Container for artifact "${name}" successfully created. Starting upload of file(s)`
      )

      // Upload each of the files that were found concurrently
      const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
        response.fileContainerResourceUrl,
        uploadSpecification,
        options
      )

      // Update the size of the artifact to indicate we are done uploading
      // The uncompressed size is used for display when downloading a zip of the artifact from the UI
      core.info(
        `File upload process has finished. Finalizing the artifact upload`
      )
      await uploadHttpClient.patchArtifactSize(uploadResult.totalSize, name)

      if (uploadResult.failedItems.length > 0) {
        core.info(
          `Upload finished. There were ${uploadResult.failedItems.length} items that failed to upload`
        )
      } else {
        core.info(
          `Artifact has been finalized. All files have been successfully uploaded!`
        )
      }

      core.info(
        `
The raw size of all the files that were specified for upload is ${uploadResult.totalSize} bytes
The size of all the files that were uploaded is ${uploadResult.uploadSize} bytes. This takes into account any gzip compression used to reduce the upload size, time and storage

Note: The size of downloaded zips can differ significantly from the reported size. For more information see: https://github.com/actions/upload-artifact#zipped-artifact-downloads \r\n`
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
      core.info('Directory structure has been setup for the artifact')
      await createEmptyFilesForArtifact(
        downloadSpecification.emptyFilesToCreate
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

    let downloadedArtifacts = 0
    while (downloadedArtifacts < artifacts.count) {
      const currentArtifactToDownload = artifacts.value[downloadedArtifacts]
      downloadedArtifacts += 1
      core.info(
        `starting download of artifact ${currentArtifactToDownload.name} : ${downloadedArtifacts}/${artifacts.count}`
      )

      // Get container entries for the specific artifact
      const items = await downloadHttpClient.getContainerItems(
        currentArtifactToDownload.name,
        currentArtifactToDownload.fileContainerResourceUrl
      )

      const downloadSpecification = getDownloadSpecification(
        currentArtifactToDownload.name,
        items.value,
        path,
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
        await createEmptyFilesForArtifact(
          downloadSpecification.emptyFilesToCreate
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
    return response
  }
}
