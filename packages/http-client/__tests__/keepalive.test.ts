import * as httpm from '../lib'

describe('basics', () => {
  let _http: httpm.HttpClient

  beforeEach(() => {
    _http = new httpm.HttpClient('http-client-tests', [], {keepAlive: true})
  })

  afterEach(() => {
    _http.dispose()
  })

  it('does basic http get request with keepAlive true', async () => {
    const res: httpm.HttpClientResponse = await _http.get(
      'http://postman-echo.com/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('http://postman-echo.com/get')
  })

  it('does basic head request with keepAlive true', async () => {
    const res: httpm.HttpClientResponse = await _http.head(
      'http://postman-echo.com/get'
    )
    expect(res.message.statusCode).toBe(200)
  })

  it('does basic http delete request with keepAlive true', async () => {
    const res: httpm.HttpClientResponse = await _http.del(
      'http://postman-echo.com/delete'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    JSON.parse(body)
  })

  it('does basic http post request with keepAlive true', async () => {
    const b = 'Hello World!'
    const res: httpm.HttpClientResponse = await _http.post(
      'http://postman-echo.com/post',
      b
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://postman-echo.com/post')
  })

  it('does basic http patch request with keepAlive true', async () => {
    const b = 'Hello World!'
    const res: httpm.HttpClientResponse = await _http.patch(
      'http://postman-echo.com/patch',
      b
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.data).toBe(b)
    expect(obj.url).toBe('http://postman-echo.com/patch')
  })

  it('does basic http options request with keepAlive true', async () => {
    const res: httpm.HttpClientResponse = await _http.options(
      'http://postman-echo.com'
    )
    expect(res.message.statusCode).toBe(200)
    await res.readBody()
  })
})
