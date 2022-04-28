import * as httpm from '../_out'

describe('basics', () => {
  let _http: httpm.HttpClient

  beforeEach(() => {
    _http = new httpm.HttpClient('http-client-tests', [], {keepAlive: true})
  })

  afterEach(() => {
    _http.dispose()
  })

  it('does basic http get request with keepAlive true', async done => {
    let res: httpm.HttpClientResponse = await _http.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    done()
  })

  it('does basic head request with keepAlive true', async done => {
    let res: httpm.HttpClientResponse = await _http.head(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    done()
  })

  it('does basic http delete request with keepAlive true', async done => {
    let res: httpm.HttpClientResponse = await _http.del(
      'http://httpbin.org/delete'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    done()
  })

  it('does basic http post request with keepAlive true', async done => {
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

  it('does basic http patch request with keepAlive true', async done => {
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

  it('does basic http options request with keepAlive true', async done => {
    let res: httpm.HttpClientResponse = await _http.options(
      'http://httpbin.org'
    )
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    done()
  })
})
