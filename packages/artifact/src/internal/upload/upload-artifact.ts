import * as core from '@actions/core'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'
import {validateArtifactName} from './path-and-artifact-name-validation'
import {createArtifactTwirpClient} from '../shared/artifact-twirp-client'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification'
import {BackendIds, getBackendIdsFromToken, getExpiration} from '../shared/util'
import {
  CreateArtifactRequest,
  CreateArtifactResponse,
  FinalizeArtifactResponse
} from 'src/generated'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadOptions | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<UploadResponse> {
  try {
    validateArtifactName(name)
    validateRootDirectory(rootDirectory)
  } catch (error) {
    core.warning(
      `Received error trying to validate artifact name or root directory: ${error}`
    )
    return {
      success: false
    }
  }

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

  // get the IDs needed for the artifact creation
  const backendIds = getBackendIds()
  if (!backendIds.workflowRunBackendId || !backendIds.workflowJobRunBackendId) {
    core.warning(`Failed to get backend ids`)
    return {
      success: false
    }
  }

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
  const createArtifactResp = await createArtifact(() =>
    artifactClient.CreateArtifact(createArtifactReq)
  )
  if (!createArtifactResp || !createArtifactResp.ok) {
    core.warning(`Failed to create artifact`)
    return {
      success: false
    }
  }

  // TODO - Implement upload functionality

  // finalize the artifact
  const finalizeArtifactResp = await finalizeArtifact(() =>
    artifactClient.FinalizeArtifact({
      workflowRunBackendId: backendIds.workflowRunBackendId,
      workflowJobRunBackendId: backendIds.workflowJobRunBackendId,
      name: name,
      size: '0' // TODO - Add size
    })
  )
  if (!finalizeArtifactResp || !finalizeArtifactResp.ok) {
    core.warning(`Failed to finalize artifact`)
    return {
      success: false
    }
  }
  const uploadResponse: UploadResponse = {
    success: true,
    size: 0,
    id: parseInt(finalizeArtifactResp.artifactId) // TODO - will this be a problem due to the id being a bigint?
  }

  return uploadResponse
}

async function createArtifact(
  operation: () => Promise<CreateArtifactResponse>
): Promise<CreateArtifactResponse | undefined> {
  try {
    return await operation()
  } catch (error) {
    core.warning(`Received error trying to create artifact: ${error}`)
    return
  }
}

async function finalizeArtifact(
  operation: () => Promise<FinalizeArtifactResponse>
): Promise<FinalizeArtifactResponse | undefined> {
  try {
    return await operation()
  } catch (error) {
    core.warning(`Received error trying to create artifact: ${error}`)
    return
  }
}

function getBackendIds(): BackendIds {
  try {
    return getBackendIdsFromToken()
  } catch (error) {
    core.warning(`Received error trying to get backend ids: ${error}`)
    return {
      workflowRunBackendId: '',
      workflowJobRunBackendId: ''
    }
  }
}
