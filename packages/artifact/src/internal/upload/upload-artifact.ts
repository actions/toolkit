import * as core from '@actions/core'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'
import {validateArtifactName} from './path-and-artifact-name-validation'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadOptions | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<UploadResponse> {
  validateArtifactName(name)
  validateRootDirectory(rootDirectory)

  const zipSpecification: UploadZipSpecification[] = getUploadZipSpecification(
    files,
    rootDirectory
  )
  if (zipSpecification.length === 0) {
    core.warning(`No files were found to upload`)
    return {
      success: false
    }
  }

  // TODO - Implement upload functionality

  const uploadResponse: UploadResponse = {
    success: true,
    size: 0,
    id: 0
  }

  return uploadResponse
}
