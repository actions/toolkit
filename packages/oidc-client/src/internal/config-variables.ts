import {getApiVersion} from './utils'

function getRuntimeToken(): string {
  const token = process.env['ACTIONS_RUNTIME_TOKEN']
  if (!token) {
    throw new Error('Unable to get ACTIONS_RUNTIME_TOKEN env variable')
  }
  return token
}

function getIDTokenUrl(): string {
  const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
  if (!runtimeUrl) {
    throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable')
  }
  return runtimeUrl + '?api-version=' + getApiVersion()
}


export {getIDTokenUrl, getRuntimeToken}