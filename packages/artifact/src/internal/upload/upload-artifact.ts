import * as core from '@actions/core'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'
import {getExpiration} from './retention'
import {validateArtifactName} from './path-and-artifact-name-validation'
import {createArtifactTwirpClient} from '../shared/artifact-twirp-client'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification'
import {getBackendIdsFromToken} from '../shared/util'
import {CreateArtifactRequest} from 'src/generated'
import {uploadZipToBlobStorage} from './blob-upload'
import {createZipUploadStream} from './zip'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadOptions | undefined
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

  const zipUploadStream = await createZipUploadStream(zipSpecification)

  // get the IDs needed for the artifact creation
  const backendIds = getBackendIdsFromToken()
  if (!backendIds.workflowRunBackendId || !backendIds.workflowJobRunBackendId) {
    core.warning(`Failed to get backend ids`)
    return {
      success: false
    }
  }
  core.debug(`Workflow Run Backend ID: ${backendIds.workflowRunBackendId}`)
  core.debug(
    `Workflow Job Run Backend ID: ${backendIds.workflowJobRunBackendId}`
  )

  // create the artifact client
  const artifactClient = createArtifactTwirpClient('upload')

  // create the artifact
  const createArtifactReq: CreateArtifactRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name: name,
    version: 4
  }

  // if there is a retention period, add it to the request
  const expiresAt = getExpiration(options?.retentionDays)
  if (expiresAt) {
    createArtifactReq.expiresAt = expiresAt
  }

  const createArtifactResp = await artifactClient.CreateArtifact(
    createArtifactReq
  )
  if (!createArtifactResp.ok) {
    core.warning(`Failed to create artifact`)
    return {
      success: false
    }
  }

  // Upload zip to blob storage
  const uploadResult = await uploadZipToBlobStorage(createArtifactResp.signedUploadUrl, zipUploadStream)
  if (uploadResult.isSuccess === false) {
    return {
      success: false
    }
  }

  // finalize the artifact
  const finalizeArtifactResp = await artifactClient.FinalizeArtifact({
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name: name,
    size: uploadResult.uploadSize!.toString()
  })
  if (!finalizeArtifactResp.ok) {
    core.warning(`Failed to finalize artifact`)
    return {
      success: false
    }
  }

  return {
    success: true,
    size: uploadResult.uploadSize,
    id: parseInt(finalizeArtifactResp.artifactId) // TODO - will this be a problem due to the id being a bigint?
  }
}
