import * as core from '@actions/core'
import {UploadOptions, UploadResponse} from '../shared/interfaces'
import {getExpiration} from './retention'
import {validateArtifactName} from './path-and-artifact-name-validation'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification'
import {getBackendIdsFromToken} from '../shared/util'
import {uploadZipToBlobStorage} from './blob-upload'
import {createZipUploadStream} from './zip'
import {
  CreateArtifactRequest,
  FinalizeArtifactRequest,
  StringValue
} from '../../generated'

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

  const zipUploadStream = await createZipUploadStream(
    zipSpecification,
    options?.compressionLevel
  )

  // get the IDs needed for the artifact creation
  const backendIds = getBackendIdsFromToken()

  // create the artifact client
  const artifactClient = internalArtifactTwirpClient()

  // create the artifact
  const createArtifactReq: CreateArtifactRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name,
    version: 4
  }

  // if there is a retention period, add it to the request
  const expiresAt = getExpiration(options?.retentionDays)
  if (expiresAt) {
    createArtifactReq.expiresAt = expiresAt
  }

  const createArtifactResp =
    await artifactClient.CreateArtifact(createArtifactReq)
  if (!createArtifactResp.ok) {
    core.warning(`Failed to create artifact`)
    return {
      success: false
    }
  }

  // Upload zip to blob storage
  const uploadResult = await uploadZipToBlobStorage(
    createArtifactResp.signedUploadUrl,
    zipUploadStream
  )
  if (uploadResult.isSuccess === false) {
    return {
      success: false
    }
  }

  // finalize the artifact
  const finalizeArtifactReq: FinalizeArtifactRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name,
    size: uploadResult.uploadSize ? uploadResult.uploadSize.toString() : '0'
  }

  if (uploadResult.sha256Hash) {
    finalizeArtifactReq.hash = StringValue.create({
      value: `sha256:${uploadResult.sha256Hash}`
    })
  }

  core.info(`Finalizing artifact upload`)

  const finalizeArtifactResp =
    await artifactClient.FinalizeArtifact(finalizeArtifactReq)
  if (!finalizeArtifactResp.ok) {
    core.warning(`Failed to finalize artifact`)
    return {
      success: false
    }
  }

  const artifactId = BigInt(finalizeArtifactResp.artifactId)
  core.info(
    `Artifact ${name}.zip successfully finalized. Artifact ID ${artifactId}`
  )

  return {
    success: true,
    size: uploadResult.uploadSize,
    id: Number(artifactId)
  }
}
