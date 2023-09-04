// Used for controlling the highWaterMark value of the zip that is being streamed
// The same value is used as the chunk size that is use during upload to blob storage
export function getUploadChunkSize(): number {
  return 8 * 1024 * 1024 // 8 MB Chunks
}

export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get the ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getResultsServiceUrl(): string {
  const resultsUrl = process.env['ACTIONS_RESULTS_URL']
  if (!resultsUrl) {
    throw new Error('Unable to get the ACTIONS_RESULTS_URL env variable')
  }
  return resultsUrl
}

export function isGhes(): boolean {
  const ghUrl = new URL(
    process.env['GITHUB_SERVER_URL'] || 'https://github.com'
  )
  return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM'
}

export function getGitHubWorkspaceDir(): string {
  const ghWorkspaceDir = process.env['GITHUB_WORKSPACE']
  if (!ghWorkspaceDir) {
    throw new Error('Unable to get the GITHUB_WORKSPACE env variable')
  }
  return ghWorkspaceDir
}
