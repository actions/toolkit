import * as core from '@actions/core'
import {
  UploadSpecification,
  getUploadSpecification
} from './upload-specification'
import {
  createArtifactInFileContainer,
  uploadArtifactToFileContainer,
  patchArtifactSize
} from './upload-http-client'
import {UploadResponse} from './upload-response'
import {UploadOptions} from './upload-options'
import {checkArtifactName} from './utils'

/**
 * Uploads an artifact
 *
 * @param name the name of the artifact, required
 * @param files a list of absolute or relative paths that denote what files should be uploaded
 * @param rootDirectory an absolute or relative file path that denotes the root parent directory of the files being uploaded
 * @param options extra options for customizing the upload behavior
 * @returns single UploadInfo object
 */
export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadOptions
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

  if (uploadSpecification.length === 0) {
    core.warning(`No files found that can be uploaded`)
  } else {
    // Create an entry for the artifact in the file container
    const response = await createArtifactInFileContainer(name)
    if (!response.fileContainerResourceUrl) {
      core.debug(response.toString())
      throw new Error(
        'No URL provided by the Artifact Service to upload an artifact to'
      )
    }
    core.debug(`Upload Resource URL: ${response.fileContainerResourceUrl}`)

    // Upload each of the files that were found concurrently
    const uploadResult = await uploadArtifactToFileContainer(
      response.fileContainerResourceUrl,
      uploadSpecification,
      options
    )

    //Update the size of the artifact to indicate we are done uploading
    await patchArtifactSize(uploadResult.size, name)

    // eslint-disable-next-line no-console
    console.log(
      `Finished uploading artifact ${name}. Reported size is ${uploadResult.size} bytes. There were ${uploadResult.failedItems.length} items that failed to upload`
    )

    uploadResponse.artifactItems = uploadSpecification.map(
      item => item.absoluteFilePath
    )
    uploadResponse.size = uploadResult.size
    uploadResponse.failedItems = uploadResult.failedItems
  }
  return uploadResponse
}

/*
Downloads a single artifact associated with a run

export async function downloadArtifact(
    name: string,
    path?: string,
    options?: DownloadOptions
  ): Promise<DownloadResponse> {

  TODO
}

Downloads all artifacts associated with a run. Because there are multiple artifacts being downloaded, a folder will be created for each one in the specified or default directory

export async function downloadAllArtifacts(
    path?: string
  ): Promise<DownloadResponse[]>{

    TODO
}
*/
