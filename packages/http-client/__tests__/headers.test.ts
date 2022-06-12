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
      'https://httpbin.org/get',
      additionalHeaders
    )
    expect(jsonObj.result.headers['Accept']).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.getJson<any>('https://httpbin.org/get')
    expect(jsonObj.result.headers['Accept']).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on postJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.postJson<any>(
      'https://httpbin.org/post',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers['Accept']).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.postJson<any>(
      'https://httpbin.org/post',
      {}
    )
    expect(jsonObj.result.headers['Accept']).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on putJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.putJson<any>(
      'https://httpbin.org/put',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers['Accept']).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.putJson<any>('https://httpbin.org/put', {})
    expect(jsonObj.result.headers['Accept']).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('preserves existing headers on patchJson', async () => {
    const additionalHeaders = {[httpm.Headers.Accept]: 'foo'}
    let jsonObj = await _http.patchJson<any>(
      'https://httpbin.org/patch',
      {},
      additionalHeaders
    )
    expect(jsonObj.result.headers['Accept']).toBe('foo')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )

    const httpWithHeaders = new httpm.HttpClient()
    httpWithHeaders.requestOptions = {
      headers: {
        [httpm.Headers.Accept]: 'baz'
      }
    }
    jsonObj = await httpWithHeaders.patchJson<any>(
      'https://httpbin.org/patch',
      {}
    )
    expect(jsonObj.result.headers['Accept']).toBe('baz')
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })
})
