import * as httpm from '../_out'
import * as am from '../_out/auth'

describe('auth', () => {
  beforeEach(() => {})

  afterEach(() => {})

  it('does basic http get request with basic auth', async () => {
    let bh: am.BasicCredentialHandler = new am.BasicCredentialHandler(
      'johndoe',
      'password'
    )
    let http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [bh])
    let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get')
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    let auth: string = obj.headers.Authorization
    let creds: string = Buffer.from(
      auth.substring('Basic '.length),
      'base64'
    ).toString()
    expect(creds).toBe('johndoe:password')
    expect(obj.url).toBe('http://httpbin.org/get')
  })

  it('does basic http get request with pat token auth', async () => {
    let token: string = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs'
    let ph: am.PersonalAccessTokenCredentialHandler = new am.PersonalAccessTokenCredentialHandler(
      token
    )

    let http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [ph])
    let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get')
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    let auth: string = obj.headers.Authorization
    let creds: string = Buffer.from(
      auth.substring('Basic '.length),
      'base64'
    ).toString()
    expect(creds).toBe('PAT:' + token)
    expect(obj.url).toBe('http://httpbin.org/get')
  })

  it('does basic http get request with pat token auth', async () => {
    let token: string = 'scbfb44vxzku5l4xgc3qfazn3lpk4awflfryc76esaiq7aypcbhs'
    let ph: am.BearerCredentialHandler = new am.BearerCredentialHandler(token)

    let http: httpm.HttpClient = new httpm.HttpClient('http-client-tests', [ph])
    let res: httpm.HttpClientResponse = await http.get('http://httpbin.org/get')
    expect(res.message.statusCode).toBe(200)
    let body: string = await res.readBody()
    let obj: any = JSON.parse(body)
    let auth: string = obj.headers.Authorization
    expect(auth).toBe('Bearer ' + token)
    expect(obj.url).toBe('http://httpbin.org/get')
  })
})
