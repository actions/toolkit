import {cpus} from 'os'

export function getUploadFileConcurrency(): number {
  return 2
}

export function getUploadChunkConcurrency(): number {
  return 1
}

export function getUploadChunkSize(): number {
  return 4 * 1024 * 1024 // 4 MB Chunks
}

export function getDownloadFileConcurrency(): number {
  // limit the number of concurrent file downloads per artifact to the number of CPU cores available
  return cpus().length
}

export function getDownloadArtifactConcurrency(): number {
  // when downloading all artifact at once, this is number of concurrent artifacts being downloaded
  return 1
}

export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getRuntimeUrl(): string {
  const runtimeUrl = process.env['ACTIONS_RUNTIME_URL']
  if (!runtimeUrl) {
    throw new Error('Unable to get ACTIONS_RUNTIME_URL env variable')
  }
  return runtimeUrl
}

export function getWorkFlowRunId(): string {
  const workFlowRunId = process.env['GITHUB_RUN_ID']
  if (!workFlowRunId) {
    throw new Error('Unable to get GITHUB_RUN_ID env variable')
  }
  return workFlowRunId
}

export function getWorkSpaceDirectory(): string {
  const workspaceDirectory = process.env['GITHUB_WORKSPACE']
  if (!workspaceDirectory) {
    throw new Error('Unable to get GITHUB_WORKSPACE env variable')
  }
  return workspaceDirectory
}
