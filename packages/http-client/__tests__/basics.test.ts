/* eslint-disable @typescript-eslint/no-explicit-any */

import * as httpm from '..'
import * as path from 'path'
import * as fs from 'fs'

const sampleFilePath: string = path.join(__dirname, 'testoutput.txt')

interface HttpBinData {
  url: string
  data: any
  json: any
  headers: any
  args?: any
}

describe('basics', () => {
  let _http: httpm.HttpClient

  beforeEach(() => {
    _http = new httpm.HttpClient('http-client-tests')
  })

  afterEach(() => {})

  it('constructs', () => {
    const http: httpm.HttpClient = new httpm.HttpClient('thttp-client-tests')
    expect(http).toBeDefined()
  })

  // responses from httpbin return something like:
  // {
  //     "args": {},
  //     "headers": {
  //       "Connection": "close",
  //       "Host": "httpbin.org",
  //       "User-Agent": "typed-test-client-tests"
  //     },
  //     "origin": "173.95.152.44",
  //     "url": "https://httpbin.org/get"
  //  }

  it('does basic http get request', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(obj.headers['User-Agent']).toBeTruthy()
  })

  it('does basic http get request with no user agent', async () => {
    const http: httpm.HttpClient = new httpm.HttpClient()
    const res: httpm.HttpClientResponse = await http.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(obj.headers['User-Agent']).toBeFalsy()
  })

  it('does basic https get request', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
  })

  it('does basic http get request with default headers', async () => {
    const http: httpm.HttpClient = new httpm.HttpClient(
      'http-client-tests',
      [],
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )
    const res: httpm.HttpClientResponse = await http.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.headers.Accept).toBe('application/json')
    expect(obj.headers['Content-Type']).toBe('application/json')
    expect(obj.url).toBe('http://httpbin.org/get')
  })

  it('does basic http get request with merged headers', async () => {
    const http: httpm.HttpClient = new httpm.HttpClient(
      'http-client-tests',
      [],
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )
    const res: httpm.HttpClientResponse = await http.get(
      'http://httpbin.org/get',
      {
        'content-type': 'application/x-www-form-urlencoded'
      }
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.headers.Accept).toBe('application/json')
    expect(obj.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded'
    )
    expect(obj.url).toBe('http://httpbin.org/get')
  })

  it('pipes a get request', async () => {
    return new Promise<void>(async resolve => {
      const file = fs.createWriteStream(sampleFilePath)
      ;(await _http.get('https://httpbin.org/get')).message
        .pipe(file)
        .on('close', () => {
          const body: string = fs.readFileSync(sampleFilePath).toString()
          const obj = JSON.parse(body)
          expect(obj.url).toBe('https://httpbin.org/get')
          resolve()
        })
    })
  })

  it('does basic get request with redirects', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://httpbin.org/get'
      )}`
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
  })

  it('does basic get request with redirects (303)', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://httpbin.org/get'
      )}&status_code=303`
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
  })

  it('returns 404 for not found get request on redirect', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://httpbin.org/status/404'
      )}&status_code=303`
    )
    expect(res.message.statusCode).toBe(404)
    await res.readBody()
  })

  it('does not follow redirects if disabled', async () => {
    const http: httpm.HttpClient = new httpm.HttpClient(
      'typed-test-client-tests',
      undefined,
      {allowRedirects: false}
    )
    const res: httpm.HttpClientResponse = await http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://httpbin.org/get'
      )}`
    )
    expect(res.message.statusCode).toBe(302)
    await res.readBody()
  })

  it('does not pass auth with diff hostname redirects', async () => {
    const headers = {
      accept: 'application/json',
      authorization: 'shhh'
    }
    const res: httpm.HttpClientResponse = await _http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://www.httpbin.org/get'
      )}`,
      headers
    )

    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    // httpbin "fixes" the casing
    expect(obj.headers['Accept']).toBe('application/json')
    expect(obj.headers['Authorization']).toBeUndefined()
    expect(obj.headers['authorization']).toBeUndefined()
    expect(obj.url).toBe('https://www.httpbin.org/get')
  })

  it('does not pass Auth with diff hostname redirects', async () => {
    const headers = {
      Accept: 'application/json',
      Authorization: 'shhh'
    }
    const res: httpm.HttpClientResponse = await _http.get(
      `https://httpbin.org/redirect-to?url=${encodeURIComponent(
        'https://www.httpbin.org/get'
      )}`,
      headers
    )

    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    // httpbin "fixes" the casing
    expect(obj.headers['Accept']).toBe('application/json')
    expect(obj.headers['Authorization']).toBeUndefined()
    expect(obj.headers['authorization']).toBeUndefined()
    expect(obj.url).toBe('https://www.httpbin.org/get')
  })

  it('does basic head request', async () => {
    const res: httpm.HttpClientResponse = await _http.head(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
  })

  it('does basic http delete request', async () => {
    const res: httpm.HttpClientResponse = await _http.del(
      'http://httpbin.org/delete'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    JSON.parse(body)
  })

  it('does basic http post request', async () => {
    const b = 'Hello World!'
    const res: httpm.HttpClientResponse = await _http.post(
      'http://httpbin.org/post',
      b
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://httpbin.org/post')
  })

  it('does basic http patch request', async () => {
    const b = 'Hello World!'
    const res: httpm.HttpClientResponse = await _http.patch(
      'http://httpbin.org/patch',
      b
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://httpbin.org/patch')
  })

  it('does basic http options request', async () => {
    const res: httpm.HttpClientResponse = await _http.options(
      'http://httpbin.org'
    )
    expect(res.message.statusCode).toBe(200)
    await res.readBody()
  })

  it('returns 404 for not found get request', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      'http://httpbin.org/status/404'
    )
    expect(res.message.statusCode).toBe(404)
    await res.readBody()
  })

  it('gets a json object', async () => {
    const jsonObj = await _http.getJson<HttpBinData>('https://httpbin.org/get')
    expect(jsonObj.statusCode).toBe(200)
    expect(jsonObj.result).toBeDefined()
    expect(jsonObj.result?.url).toBe('https://httpbin.org/get')
    expect(jsonObj.result?.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('getting a non existent json object returns null', async () => {
    const jsonObj = await _http.getJson<HttpBinData>(
      'https://httpbin.org/status/404'
    )
    expect(jsonObj.statusCode).toBe(404)
    expect(jsonObj.result).toBeNull()
  })

  it('posts a json object', async () => {
    const res = {name: 'foo'}
    const restRes = await _http.postJson<HttpBinData>(
      'https://httpbin.org/post',
      res
    )
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result?.url).toBe('https://httpbin.org/post')
    expect(restRes.result?.json.name).toBe('foo')
    expect(restRes.result?.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result?.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('puts a json object', async () => {
    const res = {name: 'foo'}
    const restRes = await _http.putJson<HttpBinData>(
      'https://httpbin.org/put',
      res
    )
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result?.url).toBe('https://httpbin.org/put')
    expect(restRes.result?.json.name).toBe('foo')

    expect(restRes.result?.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result?.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('patch a json object', async () => {
    const res = {name: 'foo'}
    const restRes = await _http.patchJson<HttpBinData>(
      'https://httpbin.org/patch',
      res
    )
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result?.url).toBe('https://httpbin.org/patch')
    expect(restRes.result?.json.name).toBe('foo')
    expect(restRes.result?.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result?.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })
})
