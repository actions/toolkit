import * as http from 'http'
import * as ifm from './interfaces'

export class BasicCredentialHandler implements ifm.IRequestHandler {
  username: string
  password: string

  constructor(username: string, password: string) {
    this.username = username
    this.password = password
  }

  prepareRequest(options: http.RequestOptions): void {
    if (!options.headers) {
      throw Error('The request has no headers')
    }
    options.headers['Authorization'] = `Basic ${Buffer.from(
      `${this.username}:${this.password}`
    ).toString('base64')}`
  }

  // This handler cannot handle 401
  canHandleAuthentication(): boolean {
    return false
  }

  async handleAuthentication(): Promise<ifm.IHttpClientResponse> {
    throw new Error('not implemented')
  }
}

export class BearerCredentialHandler implements ifm.IRequestHandler {
  token: string

  constructor(token: string) {
    this.token = token
  }

  // currently implements pre-authorization
  // TODO: support preAuth = false where it hooks on 401
  prepareRequest(options: http.RequestOptions): void {
    if (!options.headers) {
      throw Error('The request has no headers')
    }
    options.headers['Authorization'] = `Bearer ${this.token}`
  }

  // This handler cannot handle 401
  canHandleAuthentication(): boolean {
    return false
  }

  async handleAuthentication(): Promise<ifm.IHttpClientResponse> {
    throw new Error('not implemented')
  }
}

export class PersonalAccessTokenCredentialHandler
  implements ifm.IRequestHandler {
  token: string

  constructor(token: string) {
    this.token = token
  }

  // currently implements pre-authorization
  // TODO: support preAuth = false where it hooks on 401
  prepareRequest(options: http.RequestOptions): void {
    if (!options.headers) {
      throw Error('The request has no headers')
    }
    options.headers['Authorization'] = `Basic ${Buffer.from(
      `PAT:${this.token}`
    ).toString('base64')}`
  }

  // This handler cannot handle 401
  canHandleAuthentication(): boolean {
    return false
  }

  async handleAuthentication(): Promise<ifm.IHttpClientResponse> {
    throw new Error('not implemented')
  }
}
