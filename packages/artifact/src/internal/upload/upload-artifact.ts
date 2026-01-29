import * as core from '@actions/core'
import {
  UploadArtifactOptions,
  UploadArtifactResponse
} from '../shared/interfaces.js'
import {getExpiration} from './retention.js'
import {validateArtifactName} from './path-and-artifact-name-validation.js'
import {internalArtifactTwirpClient} from '../shared/artifact-twirp-client.js'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification.js'
import {getBackendIdsFromToken} from '../shared/util.js'
import {uploadZipToBlobStorage} from './blob-upload.js'
import {createZipUploadStream} from './zip.js'
import {
  CreateArtifactRequest,
  FinalizeArtifactRequest,
  StringValue
} from '../../generated/index.js'
import {FilesNotFoundError, InvalidResponseError} from '../shared/errors.js'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadArtifactOptions | undefined
): Promise<UploadArtifactResponse> {
  validateArtifactName(name)
  validateRootDirectory(rootDirectory)

  const zipSpecification: UploadZipSpecification[] = getUploadZipSpecification(
    files,
    rootDirectory
  )
  if (zipSpecification.length === 0) {
    throw new FilesNotFoundError(
      zipSpecification.flatMap(s => (s.sourcePath ? [s.sourcePath] : []))
    )
  }

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
    throw new InvalidResponseError(
      'CreateArtifact: response from backend was not ok'
    )
  }

  const zipUploadStream = await createZipUploadStream(
    zipSpecification,
    options?.compressionLevel
  )

  // Upload zip to blob storage
  const uploadResult = await uploadZipToBlobStorage(
    createArtifactResp.signedUploadUrl,
    zipUploadStream
  )

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
    throw new InvalidResponseError(
      'FinalizeArtifact: response from backend was not ok'
    )
  }

  const artifactId = BigInt(finalizeArtifactResp.artifactId)
  core.info(
    `Artifact ${name}.zip successfully finalized. Artifact ID ${artifactId}`
  )

  return {
    size: uploadResult.uploadSize,
    digest: uploadResult.sha256Hash,
    id: Number(artifactId)
  }
}
