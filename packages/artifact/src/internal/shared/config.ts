export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getResultsServiceUrl(): string {
  const resultsUrl = process.env['ACTIONS_RESULTS_URL']
  if (!resultsUrl) {
    throw new Error('Unable to get ACTIONS_RESULTS_URL env variable')
  }
  return resultsUrl
}
