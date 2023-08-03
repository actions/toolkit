export function getRuntimeToken(): string {
    const token = process.env['ACTIONS_RUNTIME_TOKEN']
    if (!token) {
      throw new Error('Unable to get the ACTIONS_RUNTIME_TOKEN environment variable which is required')
    }
    return token
}

export function getResultsServiceUrl(): string {
    const resultsUrl = process.env['ACTIONS_RESULTS_URL']
    if (!resultsUrl) {
      throw new Error('Unable to get the ACTIONS_RESULTS_URL environment variable which is required')
    }
    return resultsUrl
}
  
export function getWorkFlowRunId(): string {
    const workFlowRunId = process.env['GITHUB_RUN_ID']
    if (!workFlowRunId) {
      throw new Error('Unable to get the GITHUB_RUN_ID environment variable which is required')
    }
    return workFlowRunId
}
  
export function getWorkSpaceDirectory(): string {
    const workspaceDirectory = process.env['GITHUB_WORKSPACE']
    if (!workspaceDirectory) {
      throw new Error('Unable to get the GITHUB_WORKSPACE environment variable which is required')
    }
    return workspaceDirectory
}
  
export function getRetentionDays(): number | undefined {
    //const retentionDays = process.env['GITHUB_RETENTION_DAYS']
    const retentionDays = "30"
    if (!retentionDays) {
      return undefined
    }
    return parseInt(retentionDays)
}

export function getInitialRetryIntervalInMilliseconds(): number {
  return 3000
}

// With exponential backoff, the larger the retry count, the larger the wait time before another attempt
// The retry multiplier controls by how much the backOff time increases depending on the number of retries
export function getRetryMultiplier(): number {
  return 1.5
}

// The maximum number of retries that can be attempted before an upload or download fails
export function getRetryLimit(): number {
  return 5
}
