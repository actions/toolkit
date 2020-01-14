import * as core from '@actions/core'
import {SearchResult, findFilesToUpload} from './search'
import {
  createArtifactInFileContainer,
  uploadArtifactToFileContainer,
  patchArtifactSize
} from './upload-artifact-http-client'
import {UploadInfo} from './upload-info'
import {checkArtifactName} from './utils'

/**
 * Uploads an artifact
 *
 * @param name the name of the artifact, required
 * @param path the directory, file, or glob pattern to denote what will be uploaded, required
 * @returns single UploadInfo object
 */
export async function uploadArtifact(
  name: string,
  path: string
): Promise<UploadInfo> {
  checkArtifactName(name)

  if (!path) {
    throw new Error('Upload path must be provided')
  }

  // Search for the items that will be uploaded
  const filesToUpload: SearchResult[] = await findFilesToUpload(name, path)
  let reportedSize = -1

  if (filesToUpload === undefined) {
    core.setFailed(
      `Unable to succesfully search fo files to upload with the provided path: ${path}`
    )
  } else if (filesToUpload.length === 0) {
    core.warning(
      `No files were found for the provided path: ${path}. No artifacts will be uploaded.`
    )
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
    const uploadingArtifact: Promise<number> = Promise.resolve(
      uploadArtifactToFileContainer(
        response.fileContainerResourceUrl,
        filesToUpload
      )
    )
    uploadingArtifact.then(async size => {
      // eslint-disable-next-line no-console
      console.log(
        `All files for artifact ${name} have finished uploading. Reported upload size is ${size} bytes`
      )
      /**
       * Step 3 of 3
       * Update the size of the artifact to indicate we are done uploading
       */
      await patchArtifactSize(size, name)
      reportedSize = size
    })
  }

  return {
    artifactName: name,
    artifactItems: filesToUpload.map(item => item.absoluteFilePath),
    size: reportedSize
  }
}

/*
Downloads a single artifact associated with a run

export async function downloadArtifact(
    name: string,
    path?: string,
    createArtifactFolder?:boolean
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
