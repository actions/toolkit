import * as httpm from '../lib'
import * as am from '../lib/auth'

describe('auth', () => {
  beforeEach(() => {})

  afterEach(() => {})

  it('does basic http get request with basic auth', async () => {
    const bh: am.BasicCredentialHandler = new am.BasicCredentialHandler(
      'johndoe',
      'password'
    )
    const http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [
      bh
    ])
    const res: httpm.HttpClientResponse = await http.get(
      'http://postman-echo.com/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    const auth: string = obj.headers.authorization
    const creds: string = Buffer.from(
      auth.substring('Basic '.length),
      'base64'
    ).toString()
    expect(creds).toBe('johndoe:password')
    expect(obj.url).toBe('http://postman-echo.com/get')
  })

  it('does basic http get request with pat token auth', async () => {
    const token = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs'
    const ph: am.PersonalAccessTokenCredentialHandler = new am.PersonalAccessTokenCredentialHandler(
      token
    )

    const http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [
      ph
    ])
    const res: httpm.HttpClientResponse = await http.get(
      'http://postman-echo.com/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    const auth: string = obj.headers.authorization
    const creds: string = Buffer.from(
      auth.substring('Basic '.length),
      'base64'
    ).toString()
    expect(creds).toBe(`PAT:${token}`)
    expect(obj.url).toBe('http://postman-echo.com/get')
  })

  it('does basic http get request with pat token auth', async () => {
    const token = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs'
    const ph: am.BearerCredentialHandler = new am.BearerCredentialHandler(token)

    const http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [
      ph
    ])
    const res: httpm.HttpClientResponse = await http.get(
      'http://postman-echo.com/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    const auth: string = obj.headers.authorization
    expect(auth).toBe(`Bearer ${token}`)
    expect(obj.url).toBe('http://postman-echo.com/get')
  })
})
