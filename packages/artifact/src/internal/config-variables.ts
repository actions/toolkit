// The number of concurrent uploads that happens at the same time
export function getUploadFileConcurrency(): number {
  return 2
}

// When uploading large files that can't be uploaded with a single http call, this controls
// the chunk size that is used during upload
export function getUploadChunkSize(): number {
  return 8 * 1024 * 1024 // 8 MB Chunks
}

// The maximum number of retries that can be attempted before an upload or download fails
export function getRetryLimit(): number {
  return 5
}

// With exponential backoff, the larger the retry count, the larger the wait time before another attempt
// The retry multiplier controls by how much the backOff time increases depending on the number of retries
export function getRetryMultiplier(): number {
  return 1.5
}

// The initial wait time if an upload or download fails and a retry is being attempted for the first time
export function getInitialRetryIntervalInMilliseconds(): number {
  return 3000
}

// The number of concurrent downloads that happens at the same time
export function getDownloadFileConcurrency(): number {
  return 2
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

export function getRetentionDays(): string | undefined {
  return process.env['GITHUB_RETENTION_DAYS']
}
