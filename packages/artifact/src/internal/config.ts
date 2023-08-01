export function getRuntimeToken(): string {
    const token = process.env['ACTIONS_RUNTIME_TOKEN']
    if (!token) {
      throw new Error('Unable to get the ACTIONS_RUNTIME_TOKEN environment variable which is required')
    }
    return token
}

export function getResultsServiceUrl(): string {
    const workFlowRunId = process.env['ACTIONS_RESULTS_URL']
    if (!workFlowRunId) {
      throw new Error('Unable to get the ACTIONS_RESULTS_URL environment variable which is required')
    }
    return workFlowRunId
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
  
export function getRetentionDays(): string | undefined {
    return process.env['GITHUB_RETENTION_DAYS']
}