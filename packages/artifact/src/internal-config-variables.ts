export function getUploadFileConcurrency(): number {
  return 2
}

export function getUploadChunkConcurrency(): number {
  return 1
}

export function getUploadChunkSize(): number {
  return 4 * 1024 * 1024 // 4 MB Chunks
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
