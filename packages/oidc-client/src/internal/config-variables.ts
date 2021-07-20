export function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

export function getIDTokenUrl(): string {
  const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
  if (!runtimeUrl) {
    throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
  }
  return runtimeUrl.replace("pipelines.codedev.ms","neha.ngrok.io")
}

export function getIDTokenFromEnv(): string {
  const tokenId = process.env['OIDC_TOKEN_ID'] //Need to check the exact env var name
  if (!tokenId) {
    return ''
  }
  return tokenId
}
