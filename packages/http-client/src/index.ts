/* eslint-disable @typescript-eslint/no-explicit-any */

import * as http from 'http'
import * as https from 'https'
import * as ifm from './interfaces'
import * as net from 'net'
import * as pm from './proxy'
import * as tunnel from 'tunnel'

export enum HttpCodes {
  OK = 200,
  MultipleChoices = 300,
  MovedPermanently = 301,
  ResourceMoved = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  SwitchProxy = 306,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  TooManyRequests = 429,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504
}

export enum Headers {
  Accept = 'accept',
  ContentType = 'content-type'
}

export enum MediaTypes {
  ApplicationJson = 'application/json'
}

/**
 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
 */
export function getProxyUrl(serverUrl: string): string {
  const proxyUrl = pm.getProxyUrl(new URL(serverUrl))
  return proxyUrl ? proxyUrl.href : ''
}

const HttpRedirectCodes: number[] = [
  HttpCodes.MovedPermanently,
  HttpCodes.ResourceMoved,
  HttpCodes.SeeOther,
  HttpCodes.TemporaryRedirect,
  HttpCodes.PermanentRedirect
]
const HttpResponseRetryCodes: number[] = [
  HttpCodes.BadGateway,
  HttpCodes.ServiceUnavailable,
  HttpCodes.GatewayTimeout
]
const RetryableHttpVerbs: string[] = ['OPTIONS', 'GET', 'DELETE', 'HEAD']
const ExponentialBackoffCeiling = 10
const ExponentialBackoffTimeSlice = 5

export class HttpClientError extends Error {
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'HttpClientError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, HttpClientError.prototype)
  }

  statusCode: number
  result?: any
}

export class HttpClientResponse {
  constructor(message: http.IncomingMessage) {
    this.message = message
  }

  message: http.IncomingMessage
  async readBody(): Promise<string> {
    return new Promise<string>(async resolve => {
      let output = Buffer.alloc(0)

      this.message.on('data', (chunk: Buffer) => {
        output = Buffer.concat([output, chunk])
      })

      this.message.on('end', () => {
        resolve(output.toString())
      })
    })
  }
}

export function isHttps(requestUrl: string): boolean {
  const parsedUrl: URL = new URL(requestUrl)
  return parsedUrl.protocol === 'https:'
}

export class HttpClient {
  userAgent: string | undefined
  handlers: ifm.RequestHandler[]
  requestOptions: ifm.RequestOptions | undefined

  private _ignoreSslError = false
  private _socketTimeout: number | undefined
  private _allowRedirects = true
  private _allowRedirectDowngrade = false
  private _maxRedirects = 50
  private _allowRetries = false
  private _maxRetries = 1
  private _agent: any
  private _proxyAgent: any
  private _keepAlive = false
  private _disposed = false

  constructor(
    userAgent?: string,
    handlers?: ifm.RequestHandler[],
    requestOptions?: ifm.RequestOptions
  ) {
    this.userAgent = userAgent
    this.handlers = handlers || []
    this.requestOptions = requestOptions
    if (requestOptions) {
      if (requestOptions.ignoreSslError != null) {
        this._ignoreSslError = requestOptions.ignoreSslError
      }

      this._socketTimeout = requestOptions.socketTimeout

      if (requestOptions.allowRedirects != null) {
        this._allowRedirects = requestOptions.allowRedirects
      }

      if (requestOptions.allowRedirectDowngrade != null) {
        this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade
      }

      if (requestOptions.maxRedirects != null) {
        this._maxRedirects = Math.max(requestOptions.maxRedirects, 0)
      }

      if (requestOptions.keepAlive != null) {
        this._keepAlive = requestOptions.keepAlive
      }

      if (requestOptions.allowRetries != null) {
        this._allowRetries = requestOptions.allowRetries
      }

      if (requestOptions.maxRetries != null) {
        this._maxRetries = requestOptions.maxRetries
      }
    }
  }

  async options(
    requestUrl: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('OPTIONS', requestUrl, null, additionalHeaders || {})
  }

  async get(
    requestUrl: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('GET', requestUrl, null, additionalHeaders || {})
  }

  async del(
    requestUrl: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('DELETE', requestUrl, null, additionalHeaders || {})
  }

  async post(
    requestUrl: string,
    data: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('POST', requestUrl, data, additionalHeaders || {})
  }

  async patch(
    requestUrl: string,
    data: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('PATCH', requestUrl, data, additionalHeaders || {})
  }

  async put(
    requestUrl: string,
    data: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('PUT', requestUrl, data, additionalHeaders || {})
  }

  async head(
    requestUrl: string,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request('HEAD', requestUrl, null, additionalHeaders || {})
  }

  async sendStream(
    verb: string,
    requestUrl: string,
    stream: NodeJS.ReadableStream,
    additionalHeaders?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    return this.request(verb, requestUrl, stream, additionalHeaders)
  }

  /**
   * Gets a typed object from an endpoint
   * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
   */
  async getJson<T>(
    requestUrl: string,
    additionalHeaders: http.OutgoingHttpHeaders = {}
  ): Promise<ifm.TypedResponse<T>> {
    additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.Accept,
      MediaTypes.ApplicationJson
    )
    const res: HttpClientResponse = await this.get(
      requestUrl,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  async postJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: http.OutgoingHttpHeaders = {}
  ): Promise<ifm.TypedResponse<T>> {
    const data: string = JSON.stringify(obj, null, 2)
    additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.Accept,
      MediaTypes.ApplicationJson
    )
    additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.ContentType,
      MediaTypes.ApplicationJson
    )
    const res: HttpClientResponse = await this.post(
      requestUrl,
      data,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  async putJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: http.OutgoingHttpHeaders = {}
  ): Promise<ifm.TypedResponse<T>> {
    const data: string = JSON.stringify(obj, null, 2)
    additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.Accept,
      MediaTypes.ApplicationJson
    )
    additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.ContentType,
      MediaTypes.ApplicationJson
    )
    const res: HttpClientResponse = await this.put(
      requestUrl,
      data,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  async patchJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: http.OutgoingHttpHeaders = {}
  ): Promise<ifm.TypedResponse<T>> {
    const data: string = JSON.stringify(obj, null, 2)
    additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.Accept,
      MediaTypes.ApplicationJson
    )
    additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.ContentType,
      MediaTypes.ApplicationJson
    )
    const res: HttpClientResponse = await this.patch(
      requestUrl,
      data,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  /**
   * Makes a raw http request.
   * All other methods such as get, post, patch, and request ultimately call this.
   * Prefer get, del, post and patch
   */
  async request(
    verb: string,
    requestUrl: string,
    data: string | NodeJS.ReadableStream | null,
    headers?: http.OutgoingHttpHeaders
  ): Promise<HttpClientResponse> {
    if (this._disposed) {
      throw new Error('Client has already been disposed.')
    }

    const parsedUrl = new URL(requestUrl)
    let info: ifm.RequestInfo = this._prepareRequest(verb, parsedUrl, headers)

    // Only perform retries on reads since writes may not be idempotent.
    const maxTries: number =
      this._allowRetries && RetryableHttpVerbs.includes(verb)
        ? this._maxRetries + 1
        : 1
    let numTries = 0

    let response: HttpClientResponse | undefined
    do {
      response = await this.requestRaw(info, data)

      // Check if it's an authentication challenge
      if (
        response &&
        response.message &&
        response.message.statusCode === HttpCodes.Unauthorized
      ) {
        let authenticationHandler: ifm.RequestHandler | undefined

        for (const handler of this.handlers) {
          if (handler.canHandleAuthentication(response)) {
            authenticationHandler = handler
            break
          }
        }

        if (authenticationHandler) {
          return authenticationHandler.handleAuthentication(this, info, data)
        } else {
          // We have received an unauthorized response but have no handlers to handle it.
          // Let the response return to the caller.
          return response
        }
      }

      let redirectsRemaining: number = this._maxRedirects
      while (
        response.message.statusCode &&
        HttpRedirectCodes.includes(response.message.statusCode) &&
        this._allowRedirects &&
        redirectsRemaining > 0
      ) {
        const redirectUrl: string | undefined =
          response.message.headers['location']
        if (!redirectUrl) {
          // if there's no location to redirect to, we won't
          break
        }
        const parsedRedirectUrl = new URL(redirectUrl)
        if (
          parsedUrl.protocol === 'https:' &&
          parsedUrl.protocol !== parsedRedirectUrl.protocol &&
          !this._allowRedirectDowngrade
        ) {
          throw new Error(
            'Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.'
          )
        }

        // we need to finish reading the response before reassigning response
        // which will leak the open socket.
        await response.readBody()

        // strip authorization header if redirected to a different hostname
        if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
          for (const header in headers) {
            // header names are case insensitive
            if (header.toLowerCase() === 'authorization') {
              delete headers[header]
            }
          }
        }

        // let's make the request with the new redirectUrl
        info = this._prepareRequest(verb, parsedRedirectUrl, headers)
        response = await this.requestRaw(info, data)
        redirectsRemaining--
      }

      if (
        !response.message.statusCode ||
        !HttpResponseRetryCodes.includes(response.message.statusCode)
      ) {
        // If not a retry code, return immediately instead of retrying
        return response
      }

      numTries += 1

      if (numTries < maxTries) {
        await response.readBody()
        await this._performExponentialBackoff(numTries)
      }
    } while (numTries < maxTries)

    return response
  }

  /**
   * Needs to be called if keepAlive is set to true in request options.
   */
  dispose(): void {
    if (this._agent) {
      this._agent.destroy()
    }

    this._disposed = true
  }

  /**
   * Raw request.
   * @param info
   * @param data
   */
  async requestRaw(
    info: ifm.RequestInfo,
    data: string | NodeJS.ReadableStream | null
  ): Promise<HttpClientResponse> {
    return new Promise<HttpClientResponse>((resolve, reject) => {
      function callbackForResult(err?: Error, res?: HttpClientResponse): void {
        if (err) {
          reject(err)
        } else if (!res) {
          // If `err` is not passed, then `res` must be passed.
          reject(new Error('Unknown error'))
        } else {
          resolve(res)
        }
      }

      this.requestRawWithCallback(info, data, callbackForResult)
    })
  }

  /**
   * Raw request with callback.
   * @param info
   * @param data
   * @param onResult
   */
  requestRawWithCallback(
    info: ifm.RequestInfo,
    data: string | NodeJS.ReadableStream | null,
    onResult: (err?: Error, res?: HttpClientResponse) => void
  ): void {
    if (typeof data === 'string') {
      if (!info.options.headers) {
        info.options.headers = {}
      }
      info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8')
    }

    let callbackCalled = false
    function handleResult(err?: Error, res?: HttpClientResponse): void {
      if (!callbackCalled) {
        callbackCalled = true
        onResult(err, res)
      }
    }

    const req: http.ClientRequest = info.httpModule.request(
      info.options,
      (msg: http.IncomingMessage) => {
        const res: HttpClientResponse = new HttpClientResponse(msg)
        handleResult(undefined, res)
      }
    )

    let socket: net.Socket
    req.on('socket', sock => {
      socket = sock
    })

    // If we ever get disconnected, we want the socket to timeout eventually
    req.setTimeout(this._socketTimeout || 3 * 60000, () => {
      if (socket) {
        socket.end()
      }
      handleResult(new Error(`Request timeout: ${info.options.path}`))
    })

    req.on('error', function(err) {
      // err has statusCode property
      // res should have headers
      handleResult(err)
    })

    if (data && typeof data === 'string') {
      req.write(data, 'utf8')
    }

    if (data && typeof data !== 'string') {
      data.on('close', function() {
        req.end()
      })

      data.pipe(req)
    } else {
      req.end()
    }
  }

  /**
   * Gets an http agent. This function is useful when you need an http agent that handles
   * routing through a proxy server - depending upon the url and proxy environment variables.
   * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
   */
  getAgent(serverUrl: string): http.Agent {
    const parsedUrl = new URL(serverUrl)
    return this._getAgent(parsedUrl)
  }

  private _prepareRequest(
    method: string,
    requestUrl: URL,
    headers?: http.OutgoingHttpHeaders
  ): ifm.RequestInfo {
    const info: ifm.RequestInfo = <ifm.RequestInfo>{}

    info.parsedUrl = requestUrl
    const usingSsl: boolean = info.parsedUrl.protocol === 'https:'
    info.httpModule = usingSsl ? https : http
    const defaultPort: number = usingSsl ? 443 : 80

    info.options = <http.RequestOptions>{}
    info.options.host = info.parsedUrl.hostname
    info.options.port = info.parsedUrl.port
      ? parseInt(info.parsedUrl.port)
      : defaultPort
    info.options.path =
      (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '')
    info.options.method = method
    info.options.headers = this._mergeHeaders(headers)
    if (this.userAgent != null) {
      info.options.headers['user-agent'] = this.userAgent
    }

    info.options.agent = this._getAgent(info.parsedUrl)

    // gives handlers an opportunity to participate
    if (this.handlers) {
      for (const handler of this.handlers) {
        handler.prepareRequest(info.options)
      }
    }

    return info
  }

  private _mergeHeaders(
    headers?: http.OutgoingHttpHeaders
  ): http.OutgoingHttpHeaders {
    if (this.requestOptions && this.requestOptions.headers) {
      return Object.assign(
        {},
        lowercaseKeys(this.requestOptions.headers),
        lowercaseKeys(headers || {})
      )
    }

    return lowercaseKeys(headers || {})
  }

  private _getExistingOrDefaultHeader(
    additionalHeaders: http.OutgoingHttpHeaders,
    header: string,
    _default: string
  ): string | number | string[] {
    let clientHeader: string | undefined
    if (this.requestOptions && this.requestOptions.headers) {
      clientHeader = lowercaseKeys(this.requestOptions.headers)[header]
    }
    return additionalHeaders[header] || clientHeader || _default
  }

  private _getAgent(parsedUrl: URL): http.Agent {
    let agent
    const proxyUrl = pm.getProxyUrl(parsedUrl)
    const useProxy = proxyUrl && proxyUrl.hostname

    if (this._keepAlive && useProxy) {
      agent = this._proxyAgent
    }

    if (this._keepAlive && !useProxy) {
      agent = this._agent
    }

    // if agent is already assigned use that agent.
    if (agent) {
      return agent
    }

    const usingSsl = parsedUrl.protocol === 'https:'
    let maxSockets = 100
    if (this.requestOptions) {
      maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets
    }

    // This is `useProxy` again, but we need to check `proxyURl` directly for TypeScripts's flow analysis.
    if (proxyUrl && proxyUrl.hostname) {
      const agentOptions = {
        maxSockets,
        keepAlive: this._keepAlive,
        proxy: {
          ...((proxyUrl.username || proxyUrl.password) && {
            proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
          }),
          host: proxyUrl.hostname,
          port: proxyUrl.port
        }
      }

      let tunnelAgent: Function
      const overHttps = proxyUrl.protocol === 'https:'
      if (usingSsl) {
        tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp
      } else {
        tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp
      }

      agent = tunnelAgent(agentOptions)
      this._proxyAgent = agent
    }

    // if reusing agent across request and tunneling agent isn't assigned create a new agent
    if (this._keepAlive && !agent) {
      const options = {keepAlive: this._keepAlive, maxSockets}
      agent = usingSsl ? new https.Agent(options) : new http.Agent(options)
      this._agent = agent
    }

    // if not using private agent and tunnel agent isn't setup then use global agent
    if (!agent) {
      agent = usingSsl ? https.globalAgent : http.globalAgent
    }

    if (usingSsl && this._ignoreSslError) {
      // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
      // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
      // we have to cast it to any and change it directly
      agent.options = Object.assign(agent.options || {}, {
        rejectUnauthorized: false
      })
    }

    return agent
  }

  private async _performExponentialBackoff(retryNumber: number): Promise<void> {
    retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber)
    const ms: number = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber)
    return new Promise(resolve => setTimeout(() => resolve(), ms))
  }

  private async _processResponse<T>(
    res: HttpClientResponse,
    options?: ifm.RequestOptions
  ): Promise<ifm.TypedResponse<T>> {
    return new Promise<ifm.TypedResponse<T>>(async (resolve, reject) => {
      const statusCode = res.message.statusCode || 0

      const response: ifm.TypedResponse<T> = {
        statusCode,
        result: null,
        headers: {}
      }

      // not found leads to null obj returned
      if (statusCode === HttpCodes.NotFound) {
        resolve(response)
      }

      // get the result from the body

      function dateTimeDeserializer(key: any, value: any): any {
        if (typeof value === 'string') {
          const a = new Date(value)
          if (!isNaN(a.valueOf())) {
            return a
          }
        }

        return value
      }

      let obj: any
      let contents: string | undefined

      try {
        contents = await res.readBody()
        if (contents && contents.length > 0) {
          if (options && options.deserializeDates) {
            obj = JSON.parse(contents, dateTimeDeserializer)
          } else {
            obj = JSON.parse(contents)
          }

          response.result = obj
        }

        response.headers = res.message.headers
      } catch (err) {
        // Invalid resource (contents not json);  leaving result obj null
      }

      // note that 3xx redirects are handled by the http layer.
      if (statusCode > 299) {
        let msg: string

        // if exception/error in body, attempt to get better error
        if (obj && obj.message) {
          msg = obj.message
        } else if (contents && contents.length > 0) {
          // it may be the case that the exception is in the body message as string
          msg = contents
        } else {
          msg = `Failed request: (${statusCode})`
        }

        const err = new HttpClientError(msg, statusCode)
        err.result = response.result

        reject(err)
      } else {
        resolve(response)
      }
    })
  }
}

const lowercaseKeys = (obj: {[index: string]: any}): any =>
  Object.keys(obj).reduce((c: any, k) => ((c[k.toLowerCase()] = obj[k]), c), {})
