import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
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
import {uploadToBlobStorage} from './blob-upload.js'
import {createZipUploadStream} from './zip.js'
import {createRawFileUploadStream, WaterMarkedUploadStream} from './stream.js'
import {
  CreateArtifactRequest,
  FinalizeArtifactRequest,
  StringValue
} from '../../generated/index.js'
import {FilesNotFoundError, InvalidResponseError} from '../shared/errors.js'
import {getMimeType} from './types.js'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadArtifactOptions | undefined
): Promise<UploadArtifactResponse> {
  let artifactFileName = `${name}.zip`
  if (options?.skipArchive) {
    if (files.length === 0) {
      throw new FilesNotFoundError([])
    }

    if (files.length > 1) {
      throw new Error(
        'skipArchive option is only supported when uploading a single file'
      )
    }

    if (!fs.existsSync(files[0])) {
      throw new FilesNotFoundError(files)
    }

    artifactFileName = path.basename(files[0])
    name = artifactFileName
  }

  validateArtifactName(name)
  validateRootDirectory(rootDirectory)

  let zipSpecification: UploadZipSpecification[] = []

  if (!options?.skipArchive) {
    zipSpecification = getUploadZipSpecification(files, rootDirectory)

    if (zipSpecification.length === 0) {
      throw new FilesNotFoundError(
        zipSpecification.flatMap(s => (s.sourcePath ? [s.sourcePath] : []))
      )
    }
  }

  const contentType = getMimeType(artifactFileName)

  // get the IDs needed for the artifact creation
  const backendIds = getBackendIdsFromToken()

  // create the artifact client
  const artifactClient = internalArtifactTwirpClient()

  // create the artifact
  const createArtifactReq: CreateArtifactRequest = {
    workflowRunBackendId: backendIds.workflowRunBackendId,
    workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
    name,
    mimeType: StringValue.create({value: contentType}),
    version: 7
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

  let stream: WaterMarkedUploadStream

  if (options?.skipArchive) {
    // Upload raw file without archiving
    stream = await createRawFileUploadStream(files[0])
  } else {
    // Create and upload zip archive
    stream = await createZipUploadStream(
      zipSpecification,
      options?.compressionLevel
    )
  }

  core.info(`Uploading artifact: ${artifactFileName}`)
  const uploadResult = await uploadToBlobStorage(
    createArtifactResp.signedUploadUrl,
    stream,
    contentType
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
    `Artifact ${name} successfully finalized. Artifact ID ${artifactId}`
  )

  return {
    size: uploadResult.uploadSize,
    digest: uploadResult.sha256Hash,
    id: Number(artifactId)
  }
}
