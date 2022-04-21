import * as httpm from '../_out'
import * as ifm from '../_out/interfaces'
import * as path from 'path'
import * as fs from 'fs'

let sampleFilePath: string = path.join(__dirname, 'testoutput.txt')

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
    let http: httpm.HttpClient = new httpm.HttpClient('thttp-client-tests')
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

  it('does basic http get request', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(obj.headers['User-Agent']).toBeTruthy()
    done()
  })

  it('does basic http get request with no user agent', async done => {
    let http: httpm.HttpClient = new httpm.HttpClient()
    let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get')
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(obj.headers['User-Agent']).toBeFalsy()
    done()
  })

  it('does basic https get request', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
    done()
  })

  it('does basic http get request with default headers', async done => {
    let http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [], {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get')
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.headers.Accept).toBe('application/json')
    expect(obj.headers['Content-Type']).toBe('application/json')
    expect(obj.url).toBe('http://httpbin.org/get')
    done()
  })

  it('does basic http get request with merged headers', async done => {
    let http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [], {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    let res: httpm.HttpClientResponse = await http.get(
      'http://httpbin.org/get',
      {
        'content-type': 'application/x-www-form-urlencoded'
      }
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.headers.Accept).toBe('application/json')
    expect(obj.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded'
    )
    expect(obj.url).toBe('http://httpbin.org/get')
    done()
  })

  it('pipes a get request', () => {
    return new Promise<string>(async (resolve, reject) => {
      let file: NodeJS.WritableStream = fs.createWriteStream(sampleFilePath)
      ;(await _http.get('https://httpbin.org/get')).message
        .pipe(file)
        .on('close', () => {
          let body: string = fs.readFileSync(sampleFilePath).toString()
          let obj: any = JSON.parse(body)
          expect(obj.url).toBe('https://httpbin.org/get')
          resolve()
        })
    })
  })

  it('does basic get request with redirects', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://httpbin.org/get')
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
    done()
  })

  it('does basic get request with redirects (303)', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://httpbin.org/get') +
        '&status_code=303'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
    done()
  })

  it('returns 404 for not found get request on redirect', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://httpbin.org/status/404') +
        '&status_code=303'
    )
    expect(res.message.statusCode).toBe(404)
    let body: string = await res.readBody()
    done()
  })

  it('does not follow redirects if disabled', async done => {
    let http: httpm.HttpClient = new httpm.HttpClient(
      'typed-test-client-tests',
      null,
      {allowRedirects: false}
    )
    let res: httpm.HttpClientResponse = await http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://httpbin.org/get')
    )
    expect(res.message.statusCode).toBe(302)
    let body: string = await res.readBody()
    done()
  })

  it('does not pass auth with diff hostname redirects', async done => {
    let headers = {
      accept: 'application/json',
      authorization: 'shhh'
    }
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://www.httpbin.org/get'),
      headers
    )

    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    // httpbin "fixes" the casing
    expect(obj.headers['Accept']).toBe('application/json')
    expect(obj.headers['Authorization']).toBeUndefined()
    expect(obj.headers['authorization']).toBeUndefined()
    expect(obj.url).toBe('https://www.httpbin.org/get')

    done()
  })

  it('does not pass Auth with diff hostname redirects', async done => {
    let headers = {
      Accept: 'application/json',
      Authorization: 'shhh'
    }
    let res: httpm.HttpClientResponse = await _http.get(
      'https://httpbin.org/redirect-to?url=' +
        encodeURIComponent('https://www.httpbin.org/get'),
      headers
    )

    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    // httpbin "fixes" the casing
    expect(obj.headers['Accept']).toBe('application/json')
    expect(obj.headers['Authorization']).toBeUndefined()
    expect(obj.headers['authorization']).toBeUndefined()
    expect(obj.url).toBe('https://www.httpbin.org/get')

    done()
  })

  it('does basic head request', async done => {
    let res: httpm.HttpClientResponse = await _http.head(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    done()
  })

  it('does basic http delete request', async done => {
    let res: httpm.HttpClientResponse = await _http.del(
      'http://httpbin.org/delete'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    done()
  })

  it('does basic http post request', async done => {
    let b: string = 'Hello World!'
    let res: httpm.HttpClientResponse = await _http.post(
      'http://httpbin.org/post',
      b
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://httpbin.org/post')
    done()
  })

  it('does basic http patch request', async done => {
    let b: string = 'Hello World!'
    let res: httpm.HttpClientResponse = await _http.patch(
      'http://httpbin.org/patch',
      b
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://httpbin.org/patch')
    done()
  })

  it('does basic http options request', async done => {
    let res: httpm.HttpClientResponse = await _http.options(
      'http://httpbin.org'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    done()
  })

  it('returns 404 for not found get request', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'http://httpbin.org/status/404'
    )
    expect(res.message.statusCode).toBe(404)
    let body: string = await res.readBody()
    done()
  })

  it('gets a json object', async () => {
    let jsonObj: ifm.ITypedResponse<HttpBinData> = await _http.getJson<
      HttpBinData
    >('https://httpbin.org/get')
    expect(jsonObj.statusCode).toBe(200)
    expect(jsonObj.result).toBeDefined()
    expect(jsonObj.result.url).toBe('https://httpbin.org/get')
    expect(jsonObj.result.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(jsonObj.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('getting a non existent json object returns null', async () => {
    let jsonObj: ifm.ITypedResponse<HttpBinData> = await _http.getJson<
      HttpBinData
    >('https://httpbin.org/status/404')
    expect(jsonObj.statusCode).toBe(404)
    expect(jsonObj.result).toBeNull()
  })

  it('posts a json object', async () => {
    let res: any = {name: 'foo'}
    let restRes: ifm.ITypedResponse<HttpBinData> = await _http.postJson<
      HttpBinData
    >('https://httpbin.org/post', res)
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result.url).toBe('https://httpbin.org/post')
    expect(restRes.result.json.name).toBe('foo')
    expect(restRes.result.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('puts a json object', async () => {
    let res: any = {name: 'foo'}
    let restRes: ifm.ITypedResponse<HttpBinData> = await _http.putJson<
      HttpBinData
    >('https://httpbin.org/put', res)
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result.url).toBe('https://httpbin.org/put')
    expect(restRes.result.json.name).toBe('foo')

    expect(restRes.result.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })

  it('patch a json object', async () => {
    let res: any = {name: 'foo'}
    let restRes: ifm.ITypedResponse<HttpBinData> = await _http.patchJson<
      HttpBinData
    >('https://httpbin.org/patch', res)
    expect(restRes.statusCode).toBe(200)
    expect(restRes.result).toBeDefined()
    expect(restRes.result.url).toBe('https://httpbin.org/patch')
    expect(restRes.result.json.name).toBe('foo')
    expect(restRes.result.headers['Accept']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.result.headers['Content-Type']).toBe(
      httpm.MediaTypes.ApplicationJson
    )
    expect(restRes.headers[httpm.Headers.ContentType]).toBe(
      httpm.MediaTypes.ApplicationJson
    )
  })
})
