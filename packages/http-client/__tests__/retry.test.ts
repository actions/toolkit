import * as httpm from '../src/index'

describe('basics', () => {
  let _http: httpm.HttpClient

  beforeEach(() => {
    _http = new httpm.HttpClient('http-client-tests', undefined, {
      allowRetries: true,
      maxRetries: 5,
      retryCodes: [404, 500, 502],
      noRetryCodes: [403, 404, 504]
    })
  })

  afterEach(() => {})

  it('constructs', () => {
    const http: httpm.HttpClient = new httpm.HttpClient('thttp-client-tests')
    expect(http).toBeDefined()
  })

  it('no retry on error code 400 (not given in options)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/400'
      )}&status_code=400`
    )

    expect(res.retryCount).toBe(undefined)
    expect(res.message.statusCode).toBe(400)
  })

  it('no retry on error code 403 (noRetryOnCodes)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/403'
      )}&status_code=403`
    )

    expect(res.retryCount).toBe(undefined)
    expect(res.message.statusCode).toBe(403)
  })

  it('retry on error code 404 (retryOnCodes used over noRetryOnCode)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/404'
      )}&status_code=404`
    )

    expect(res.retryCount).toBe(5)
    expect(res.message.statusCode).toBe(404)
  })

  it('retry on error code 500 (retryOnCodes only)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/500'
      )}&status_code=500`
    )

    expect(res.retryCount).toBe(5)
    expect(res.message.statusCode).toBe(500)
  })

  it('retry on error code 502 (retryOnCodes and HttpResponseRetryCodes)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/502'
      )}&status_code=502`
    )

    expect(res.retryCount).toBe(5)
    expect(res.message.statusCode).toBe(502)
  })

  it('retry on error code 503 (HttpResponseRetryCodes only)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/503'
      )}&status_code=503`
    )

    expect(res.retryCount).toBe(5)
    expect(res.message.statusCode).toBe(503)
  })

  it('no retry on error code 504 (noRetryOnCodes used over HttpResponseRetryCodes)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://postman-echo.com/redirect-to?url=${encodeURIComponent(
        'https://postman-echo.com/status/504'
      )}&status_code=504`
    )

    expect(res.retryCount).toBe(undefined)
    expect(res.message.statusCode).toBe(504)
  })
})
