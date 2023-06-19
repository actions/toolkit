/* eslint-disable @typescript-eslint/no-explicit-any */

import * as httpm from '..'

describe('headers', () => {
  let _http: httpm.HttpClient

  beforeEach(() => {
    _http = new httpm.HttpClient('http-client-tests')
  })

  it('preserves existing headers on getJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.getJson<any>(
      'https://postman-echo.com/get',
      additionalHeaders
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.getJson<any>('https://postman-echo.com/get')
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on postJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.postJson<any>(
      'https://postman-echo.com/post',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.postJson<any>(
      'https://postman-echo.com/post',
      {}
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on putJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.putJson<any>(
      'https://postman-echo.com/put',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.putJson<any>(
      'https://postman-echo.com/put',
      {}
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on patchJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.patchJson<any>(
      'https://postman-echo.com/patch',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.patchJson<any>(
      'https://postman-echo.com/patch',
      {}
    )
    expect(jsonObj.result.headers[httpm.Headers.Accept]).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toContain(
      httpm.MediaTypes.ApplicationJson
    )
  })
})
