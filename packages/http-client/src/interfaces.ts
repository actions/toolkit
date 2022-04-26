import * as http from 'http'
import * as https from 'https'

export interface Headers {
  [header: string]: string
}

export interface HttpClient {
  options(
    requestUrl: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  get(
    requestUrl: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  del(
    requestUrl: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  post(
    requestUrl: string,
    data: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  patch(
    requestUrl: string,
    data: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  put(
    requestUrl: string,
    data: string,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  sendStream(
    verb: string,
    requestUrl: string,
    stream: NodeJS.ReadableStream,
    additionalHeaders?: Headers
  ): Promise<HttpClientResponse>
  request(
    verb: string,
    requestUrl: string,
    data: string | NodeJS.ReadableStream,
    headers: Headers
  ): Promise<HttpClientResponse>
  requestRaw(
    info: RequestInfo,
    data: string | NodeJS.ReadableStream
  ): Promise<HttpClientResponse>
  requestRawWithCallback(
    info: RequestInfo,
    data: string | NodeJS.ReadableStream,
    onResult: (err?: Error, res?: HttpClientResponse) => void
  ): void
}

export interface RequestHandler {
  prepareRequest(options: http.RequestOptions): void
  canHandleAuthentication(response: HttpClientResponse): boolean
  handleAuthentication(
    httpClient: HttpClient,
    requestInfo: RequestInfo,
    data: string | NodeJS.ReadableStream | null
  ): Promise<HttpClientResponse>
}

export interface HttpClientResponse {
  message: http.IncomingMessage
  readBody(): Promise<string>
}

export interface RequestInfo {
  options: http.RequestOptions
  parsedUrl: URL
  httpModule: typeof http | typeof https
}

export interface RequestOptions {
  headers?: Headers
  socketTimeout?: number
  ignoreSslError?: boolean
  allowRedirects?: boolean
  allowRedirectDowngrade?: boolean
  maxRedirects?: number
  maxSockets?: number
  keepAlive?: boolean
  deserializeDates?: boolean
  // Allows retries only on Read operations (since writes may not be idempotent)
  allowRetries?: boolean
  maxRetries?: number
}

export interface TypedResponse<T> {
  statusCode: number
  result: T | null
  headers: http.IncomingHttpHeaders
}
