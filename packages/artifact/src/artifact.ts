import * as core from '@actions/core'
import {SearchResult, findFilesToUpload} from './search'
import {
  createArtifactInFileContainer,
  uploadArtifactToFileContainer,
  patchArtifactSize
} from './upload-artifact-http-client'
import {UploadInfo} from './upload-info'
import {UploadOptions} from './upload-options'
import {checkArtifactName} from './utils'

/**
 * Uploads an artifact
 *
 * @param name the name of the artifact, required
 * @param path the directory, file, or glob pattern to denote what will be uploaded, required
 * @param options extra options for customizing the upload behavior
 * @returns single UploadInfo object
 */
export async function uploadArtifact(
  name: string,
  path: string,
  options?: UploadOptions
): Promise<UploadInfo> {
  checkArtifactName(name)

  if (!path) {
    throw new Error('Upload path must be provided')
  }

  // Search for the items that will be uploaded
  const filesToUpload: SearchResult[] = await findFilesToUpload(name, path)

  if (filesToUpload === undefined) {
    throw new Error(
      `Unable to successfully search for files to upload with the provided path: ${path}`
    )
  } else if (filesToUpload.length === 0) {
    core.warning(
      `No files were found for the provided path: ${path}. No artifacts will be uploaded.`
    )
    return {
      artifactName: name,
      artifactItems: [],
      size: 0,
      failedItems: []
    }
  } else {
    /**
     * Step 1 of 3
     * Create an entry for the artifact in the file container
     */
    const response = await createArtifactInFileContainer(name)
    if (!response.fileContainerResourceUrl) {
      core.debug(response.toString())
      throw new Error(
        'No URL provided by the Artifact Service to upload an artifact to'
      )
    }
    core.debug(`Upload Resource URL: ${response.fileContainerResourceUrl}`)

    /**
     * Step 2 of 3
     * Upload each of the files that were found concurrently
     */
    const uploadResult = await uploadArtifactToFileContainer(
      response.fileContainerResourceUrl,
      filesToUpload,
      options
    )
    // eslint-disable-next-line no-console
    console.log(
      `Finished uploading artifact ${name}. Reported size is ${uploadResult.size} bytes. There were ${uploadResult.failedItems.length} items that failed to upload`
    )

    /**
     * Step 3 of 3
     * Update the size of the artifact to indicate we are done uploading
     */
    await patchArtifactSize(uploadResult.size, name)

    return {
      artifactName: name,
      artifactItems: filesToUpload.map(item => item.absoluteFilePath),
      size: uploadResult.size,
      failedItems: uploadResult.failedItems
    }
  }
}

/*
Downloads a single artifact associated with a run

export async function downloadArtifact(
    name: string,
    path?: string,
    options?: DownloadOptions
  ): Promise<DownloadInfo> {

    TODO
}

Downloads all artifacts associated with a run. Because there are multiple artifacts being downloaded, a folder will be created for each one in the specified or default directory

export async function downloadAllArtifacts(
    path?: string
  ): Promise<DownloadInfo[]>{

    TODO
}
*/
