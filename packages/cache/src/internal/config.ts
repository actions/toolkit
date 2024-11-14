export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get the ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getCacheServiceVersion(): string {
  return process.env['ACTIONS_CACHE_SERVICE_V2'] ? 'v2' : 'v1';
}

export function getCacheServiceURL(): string {
  const version = getCacheServiceVersion()
  switch (version) {
    case 'v1':
      return process.env['ACTIONS_CACHE_URL'] || process.env['ACTIONS_RESULTS_URL'] || ""
    case 'v2':
      return process.env['ACTIONS_RESULTS_URL'] || ""
    default:
      throw new Error(`Unsupported cache service version: ${version}`)
  }
}