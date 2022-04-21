import http = require('http')
import https = require('https')
import ifm = require('./interfaces')
import pm = require('./proxy')

let tunnel: any

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
  let proxyUrl = pm.getProxyUrl(new URL(serverUrl))
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

  public statusCode: number
  public result?: any
}

export class HttpClientResponse implements ifm.IHttpClientResponse {
  constructor(message: http.IncomingMessage) {
    this.message = message
  }

  public message: http.IncomingMessage
  readBody(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
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

export function isHttps(requestUrl: string) {
  let parsedUrl: URL = new URL(requestUrl)
  return parsedUrl.protocol === 'https:'
}

export class HttpClient {
  userAgent: string | undefined
  handlers: ifm.IRequestHandler[]
  requestOptions: ifm.IRequestOptions

  private _ignoreSslError: boolean = false
  private _socketTimeout: number
  private _allowRedirects: boolean = true
  private _allowRedirectDowngrade: boolean = false
  private _maxRedirects: number = 50
  private _allowRetries: boolean = false
  private _maxRetries: number = 1
  private _agent
  private _proxyAgent
  private _keepAlive: boolean = false
  private _disposed: boolean = false

  constructor(
    userAgent?: string,
    handlers?: ifm.IRequestHandler[],
    requestOptions?: ifm.IRequestOptions
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

  public options(
    requestUrl: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('OPTIONS', requestUrl, null, additionalHeaders || {})
  }

  public get(
    requestUrl: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('GET', requestUrl, null, additionalHeaders || {})
  }

  public del(
    requestUrl: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('DELETE', requestUrl, null, additionalHeaders || {})
  }

  public post(
    requestUrl: string,
    data: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('POST', requestUrl, data, additionalHeaders || {})
  }

  public patch(
    requestUrl: string,
    data: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('PATCH', requestUrl, data, additionalHeaders || {})
  }

  public put(
    requestUrl: string,
    data: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('PUT', requestUrl, data, additionalHeaders || {})
  }

  public head(
    requestUrl: string,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request('HEAD', requestUrl, null, additionalHeaders || {})
  }

  public sendStream(
    verb: string,
    requestUrl: string,
    stream: NodeJS.ReadableStream,
    additionalHeaders?: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    return this.request(verb, requestUrl, stream, additionalHeaders)
  }

  /**
   * Gets a typed object from an endpoint
   * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
   */
  public async getJson<T>(
    requestUrl: string,
    additionalHeaders: ifm.IHeaders = {}
  ): Promise<ifm.ITypedResponse<T>> {
    additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(
      additionalHeaders,
      Headers.Accept,
      MediaTypes.ApplicationJson
    )
    let res: ifm.IHttpClientResponse = await this.get(
      requestUrl,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  public async postJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: ifm.IHeaders = {}
  ): Promise<ifm.ITypedResponse<T>> {
    let data: string = JSON.stringify(obj, null, 2)
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
    let res: ifm.IHttpClientResponse = await this.post(
      requestUrl,
      data,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  public async putJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: ifm.IHeaders = {}
  ): Promise<ifm.ITypedResponse<T>> {
    let data: string = JSON.stringify(obj, null, 2)
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
    let res: ifm.IHttpClientResponse = await this.put(
      requestUrl,
      data,
      additionalHeaders
    )
    return this._processResponse<T>(res, this.requestOptions)
  }

  public async patchJson<T>(
    requestUrl: string,
    obj: any,
    additionalHeaders: ifm.IHeaders = {}
  ): Promise<ifm.ITypedResponse<T>> {
    let data: string = JSON.stringify(obj, null, 2)
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
    let res: ifm.IHttpClientResponse = await this.patch(
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
  public async request(
    verb: string,
    requestUrl: string,
    data: string | NodeJS.ReadableStream,
    headers: ifm.IHeaders
  ): Promise<ifm.IHttpClientResponse> {
    if (this._disposed) {
      throw new Error('Client has already been disposed.')
    }

    let parsedUrl = new URL(requestUrl)
    let info: ifm.IRequestInfo = this._prepareRequest(verb, parsedUrl, headers)

    // Only perform retries on reads since writes may not be idempotent.
    let maxTries: number =
      this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1
        ? this._maxRetries + 1
        : 1
    let numTries: number = 0

    let response: HttpClientResponse
    while (numTries < maxTries) {
      response = await this.requestRaw(info, data)

      // Check if it's an authentication challenge
      if (
        response &&
        response.message &&
        response.message.statusCode === HttpCodes.Unauthorized
      ) {
        let authenticationHandler: ifm.IRequestHandler

        for (let i = 0; i < this.handlers.length; i++) {
          if (this.handlers[i].canHandleAuthentication(response)) {
            authenticationHandler = this.handlers[i]
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
        HttpRedirectCodes.indexOf(response.message.statusCode) != -1 &&
        this._allowRedirects &&
        redirectsRemaining > 0
      ) {
        const redirectUrl: string | null = response.message.headers['location']
        if (!redirectUrl) {
          // if there's no location to redirect to, we won't
          break
        }
        let parsedRedirectUrl = new URL(redirectUrl)
        if (
          parsedUrl.protocol == 'https:' &&
          parsedUrl.protocol != parsedRedirectUrl.protocol &&
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
          for (let header in headers) {
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

      if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
        // If not a retry code, return immediately instead of retrying
        return response
      }

      numTries += 1

      if (numTries < maxTries) {
        await response.readBody()
        await this._performExponentialBackoff(numTries)
      }
    }

    return response
  }

  /**
   * Needs to be called if keepAlive is set to true in request options.
   */
  public dispose() {
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
  public requestRaw(
    info: ifm.IRequestInfo,
    data: string | NodeJS.ReadableStream
  ): Promise<ifm.IHttpClientResponse> {
    return new Promise<ifm.IHttpClientResponse>((resolve, reject) => {
      let callbackForResult = function (
        err: any,
        res: ifm.IHttpClientResponse
      ) {
        if (err) {
          reject(err)
        }

        resolve(res)
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
  public requestRawWithCallback(
    info: ifm.IRequestInfo,
    data: string | NodeJS.ReadableStream,
    onResult: (err: any, res: ifm.IHttpClientResponse) => void
  ): void {
    let socket

    if (typeof data === 'string') {
      info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8')
    }

    let callbackCalled: boolean = false
    let handleResult = (err: any, res: HttpClientResponse) => {
      if (!callbackCalled) {
        callbackCalled = true
        onResult(err, res)
      }
    }

    let req: http.ClientRequest = info.httpModule.request(
      info.options,
      (msg: http.IncomingMessage) => {
        let res: HttpClientResponse = new HttpClientResponse(msg)
        handleResult(null, res)
      }
    )

    req.on('socket', sock => {
      socket = sock
    })

    // If we ever get disconnected, we want the socket to timeout eventually
    req.setTimeout(this._socketTimeout || 3 * 60000, () => {
      if (socket) {
        socket.end()
      }
      handleResult(new Error('Request timeout: ' + info.options.path), null)
    })

    req.on('error', function (err) {
      // err has statusCode property
      // res should have headers
      handleResult(err, null)
    })

    if (data && typeof data === 'string') {
      req.write(data, 'utf8')
    }

    if (data && typeof data !== 'string') {
      data.on('close', function () {
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
  public getAgent(serverUrl: string): http.Agent {
    let parsedUrl = new URL(serverUrl)
    return this._getAgent(parsedUrl)
  }

  private _prepareRequest(
    method: string,
    requestUrl: URL,
    headers: ifm.IHeaders
  ): ifm.IRequestInfo {
    const info: ifm.IRequestInfo = <ifm.IRequestInfo>{}

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
      this.handlers.forEach(handler => {
        handler.prepareRequest(info.options)
      })
    }

    return info
  }

  private _mergeHeaders(headers: ifm.IHeaders): ifm.IHeaders {
    const lowercaseKeys = obj =>
      Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {})

    if (this.requestOptions && this.requestOptions.headers) {
      return Object.assign(
        {},
        lowercaseKeys(this.requestOptions.headers),
        lowercaseKeys(headers)
      )
    }

    return lowercaseKeys(headers || {})
  }

  private _getExistingOrDefaultHeader(
    additionalHeaders: ifm.IHeaders,
    header: string,
    _default: string
  ) {
    const lowercaseKeys = obj =>
      Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {})

    let clientHeader: string
    if (this.requestOptions && this.requestOptions.headers) {
      clientHeader = lowercaseKeys(this.requestOptions.headers)[header]
    }
    return additionalHeaders[header] || clientHeader || _default
  }

  private _getAgent(parsedUrl: URL): http.Agent {
    let agent
    let proxyUrl: URL = pm.getProxyUrl(parsedUrl)
    let useProxy = proxyUrl && proxyUrl.hostname

    if (this._keepAlive && useProxy) {
      agent = this._proxyAgent
    }

    if (this._keepAlive && !useProxy) {
      agent = this._agent
    }

    // if agent is already assigned use that agent.
    if (!!agent) {
      return agent
    }

    const usingSsl = parsedUrl.protocol === 'https:'
    let maxSockets = 100
    if (!!this.requestOptions) {
      maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets
    }

    if (useProxy) {
      // If using proxy, need tunnel
      if (!tunnel) {
        tunnel = require('tunnel')
      }

      const agentOptions = {
        maxSockets: maxSockets,
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
      const options = {keepAlive: this._keepAlive, maxSockets: maxSockets}
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

  private _performExponentialBackoff(retryNumber: number): Promise<void> {
    retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber)
    const ms: number = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber)
    return new Promise(resolve => setTimeout(() => resolve(), ms))
  }

  private static dateTimeDeserializer(key: any, value: any): any {
    if (typeof value === 'string') {
      let a = new Date(value)
      if (!isNaN(a.valueOf())) {
        return a
      }
    }

    return value
  }

  private async _processResponse<T>(
    res: ifm.IHttpClientResponse,
    options: ifm.IRequestOptions
  ): Promise<ifm.ITypedResponse<T>> {
    return new Promise<ifm.ITypedResponse<T>>(async (resolve, reject) => {
      const statusCode: number = res.message.statusCode

      const response: ifm.ITypedResponse<T> = {
        statusCode: statusCode,
        result: null,
        headers: {}
      }

      // not found leads to null obj returned
      if (statusCode == HttpCodes.NotFound) {
        resolve(response)
      }

      let obj: any
      let contents: string

      // get the result from the body
      try {
        contents = await res.readBody()
        if (contents && contents.length > 0) {
          if (options && options.deserializeDates) {
            obj = JSON.parse(contents, HttpClient.dateTimeDeserializer)
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
          msg = 'Failed request: (' + statusCode + ')'
        }

        let err = new HttpClientError(msg, statusCode)
        err.result = response.result

        reject(err)
      } else {
        resolve(response)
      }
    })
  }
}
