import * as http from 'http'
import * as https from 'https'

export interface IHeaders {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface IHttpClient {
  options(
    requestUrl: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  get(
    requestUrl: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  del(
    requestUrl: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  post(
    requestUrl: string,
    data: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  patch(
    requestUrl: string,
    data: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  put(
    requestUrl: string,
    data: string,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  sendStream(
    verb: string,
    requestUrl: string,
    stream: NodeJS.ReadableStream,
    additionalHeaders?: IHeaders
  ): Promise<IHttpClientResponse>
  request(
    verb: string,
    requestUrl: string,
    data: string | NodeJS.ReadableStream,
    headers: IHeaders
  ): Promise<IHttpClientResponse>
  requestRaw(
    info: IRequestInfo,
    data: string | NodeJS.ReadableStream
  ): Promise<IHttpClientResponse>
  requestRawWithCallback(
    info: IRequestInfo,
    data: string | NodeJS.ReadableStream,
    onResult: (err?: Error, res?: IHttpClientResponse) => void
  ): void
}

export interface IRequestHandler {
  prepareRequest(options: http.RequestOptions): void
  canHandleAuthentication(response: IHttpClientResponse): boolean
  handleAuthentication(
    httpClient: IHttpClient,
    requestInfo: IRequestInfo,
    data: string | NodeJS.ReadableStream | null
  ): Promise<IHttpClientResponse>
}

export interface IHttpClientResponse {
  message: http.IncomingMessage
  readBody(): Promise<string>
}

export interface IRequestInfo {
  options: http.RequestOptions
  parsedUrl: URL
  httpModule: typeof http | typeof https
}

export interface IRequestOptions {
  headers?: IHeaders
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

export interface ITypedResponse<T> {
  statusCode: number
  result: T | null
  headers: http.IncomingHttpHeaders
}
