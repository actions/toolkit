/**
 *  Mocks default limits for easier testing
 */
export function getUploadFileConcurrency(): number {
  return 1
}

export function getUploadChunkConcurrency(): number {
  return 1
}

export function getUploadChunkSize(): number {
  return 4 * 1024 * 1024 // 4 MB Chunks
}

export function getRetryLimit(): number {
  return 2
}

export function getRetryMultiplier(): number {
  return 1.5
}

export function getInitialRetryIntervalInMilliseconds(): number {
  return 10
}

export function getDownloadFileConcurrency(): number {
  return 1
}

/**
 * Mocks the 'ACTIONS_RUNTIME_TOKEN', 'ACTIONS_RUNTIME_URL' and 'GITHUB_RUN_ID' env variables
 * that are only available from a node context on the runner. This allows for tests to run
 * locally without the env variables actually being set
 */
export function getRuntimeToken(): string {
  return 'totally-valid-token'
}

export function getRuntimeUrl(): string {
  return 'https://www.example.com/'
}

export function getWorkFlowRunId(): string {
  return '15'
}

export function getRetentionDays(): string | undefined {
  return '45'
}
