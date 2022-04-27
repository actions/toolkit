/* eslint-disable @typescript-eslint/no-explicit-any */

import * as http from 'http'
import * as httpm from '../lib/'
import * as pm from '../lib/proxy'
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const proxy = require('proxy')

let _proxyConnects: string[]
let _proxyServer: http.Server
const _proxyUrl = 'http://127.0.0.1:8080'

describe('proxy', () => {
  beforeAll(async () => {
    // Start proxy server
    _proxyServer = proxy()
    await new Promise<void>(resolve => {
      const port = Number(_proxyUrl.split(':')[2])
      _proxyServer.listen(port, () => resolve())
    })
    _proxyServer.on('connect', req => {
      _proxyConnects.push(req.url)
    })
  })

  beforeEach(() => {
    _proxyConnects = []
    _clearVars()
  })

  afterEach(() => {})

  afterAll(async () => {
    _clearVars()

    // Stop proxy server
    await new Promise<void>(resolve => {
      _proxyServer.once('close', () => resolve())
      _proxyServer.close()
    })
  })

  it('getProxyUrl does not return proxyUrl if variables not set', () => {
    const proxyUrl = pm.getProxyUrl(new URL('https://github.com'))
    expect(proxyUrl).toBeUndefined()
  })

  it('getProxyUrl returns proxyUrl if https_proxy set for https url', () => {
    process.env['https_proxy'] = 'https://myproxysvr'
    const proxyUrl = pm.getProxyUrl(new URL('https://github.com'))
    expect(proxyUrl).toBeDefined()
  })

  it('getProxyUrl does not return proxyUrl if http_proxy set for https url', () => {
    process.env['http_proxy'] = 'https://myproxysvr'
    const proxyUrl = pm.getProxyUrl(new URL('https://github.com'))
    expect(proxyUrl).toBeUndefined()
  })

  it('getProxyUrl returns proxyUrl if http_proxy set for http url', () => {
    process.env['http_proxy'] = 'http://myproxysvr'
    const proxyUrl = pm.getProxyUrl(new URL('http://github.com'))
    expect(proxyUrl).toBeDefined()
  })

  it('getProxyUrl does not return proxyUrl if https_proxy set and in no_proxy list', () => {
    process.env['https_proxy'] = 'https://myproxysvr'
    process.env['no_proxy'] = 'otherserver,myserver,anotherserver:8080'
    const proxyUrl = pm.getProxyUrl(new URL('https://myserver'))
    expect(proxyUrl).toBeUndefined()
  })

  it('getProxyUrl returns proxyUrl if https_proxy set and not in no_proxy list', () => {
    process.env['https_proxy'] = 'https://myproxysvr'
    process.env['no_proxy'] = 'otherserver,myserver,anotherserver:8080'
    const proxyUrl = pm.getProxyUrl(new URL('https://github.com'))
    expect(proxyUrl).toBeDefined()
  })

  it('getProxyUrl does not return proxyUrl if http_proxy set and in no_proxy list', () => {
    process.env['http_proxy'] = 'http://myproxysvr'
    process.env['no_proxy'] = 'otherserver,myserver,anotherserver:8080'
    const proxyUrl = pm.getProxyUrl(new URL('http://myserver'))
    expect(proxyUrl).toBeUndefined()
  })

  it('getProxyUrl returns proxyUrl if http_proxy set and not in no_proxy list', () => {
    process.env['http_proxy'] = 'http://myproxysvr'
    process.env['no_proxy'] = 'otherserver,myserver,anotherserver:8080'
    const proxyUrl = pm.getProxyUrl(new URL('http://github.com'))
    expect(proxyUrl).toBeDefined()
  })

  it('checkBypass returns true if host as no_proxy list', () => {
    process.env['no_proxy'] = 'myserver'
    const bypass = pm.checkBypass(new URL('https://myserver'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host in no_proxy list', () => {
    process.env['no_proxy'] = 'otherserver,myserver,anotherserver:8080'
    const bypass = pm.checkBypass(new URL('https://myserver'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host in no_proxy list with spaces', () => {
    process.env['no_proxy'] = 'otherserver, myserver ,anotherserver:8080'
    const bypass = pm.checkBypass(new URL('https://myserver'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host in no_proxy list with port', () => {
    process.env['no_proxy'] = 'otherserver, myserver:8080 ,anotherserver'
    const bypass = pm.checkBypass(new URL('https://myserver:8080'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host with port in no_proxy list without port', () => {
    process.env['no_proxy'] = 'otherserver, myserver ,anotherserver'
    const bypass = pm.checkBypass(new URL('https://myserver:8080'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host in no_proxy list with default https port', () => {
    process.env['no_proxy'] = 'otherserver, myserver:443 ,anotherserver'
    const bypass = pm.checkBypass(new URL('https://myserver'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns true if host in no_proxy list with default http port', () => {
    process.env['no_proxy'] = 'otherserver, myserver:80 ,anotherserver'
    const bypass = pm.checkBypass(new URL('http://myserver'))
    expect(bypass).toBeTruthy()
  })

  it('checkBypass returns false if host not in no_proxy list', () => {
    process.env['no_proxy'] = 'otherserver, myserver ,anotherserver:8080'
    const bypass = pm.checkBypass(new URL('https://github.com'))
    expect(bypass).toBeFalsy()
  })

  it('checkBypass returns false if empty no_proxy', () => {
    process.env['no_proxy'] = ''
    const bypass = pm.checkBypass(new URL('https://github.com'))
    expect(bypass).toBeFalsy()
  })

  it('HttpClient does basic http get request through proxy', async () => {
    process.env['http_proxy'] = _proxyUrl
    const httpClient = new httpm.HttpClient()
    const res: httpm.HttpClientResponse = await httpClient.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(_proxyConnects).toEqual(['httpbin.org:80'])
  })

  it('HttoClient does basic http get request when bypass proxy', async () => {
    process.env['http_proxy'] = _proxyUrl
    process.env['no_proxy'] = 'httpbin.org'
    const httpClient = new httpm.HttpClient()
    const res: httpm.HttpClientResponse = await httpClient.get(
      'http://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('http://httpbin.org/get')
    expect(_proxyConnects).toHaveLength(0)
  })

  it('HttpClient does basic https get request through proxy', async () => {
    process.env['https_proxy'] = _proxyUrl
    const httpClient = new httpm.HttpClient()
    const res: httpm.HttpClientResponse = await httpClient.get(
      'https://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
    expect(_proxyConnects).toEqual(['httpbin.org:443'])
  })

  it('HttpClient does basic https get request when bypass proxy', async () => {
    process.env['https_proxy'] = _proxyUrl
    process.env['no_proxy'] = 'httpbin.org'
    const httpClient = new httpm.HttpClient()
    const res: httpm.HttpClientResponse = await httpClient.get(
      'https://httpbin.org/get'
    )
    expect(res.message.statusCode).toBe(200)
    const body: string = await res.readBody()
    const obj = JSON.parse(body)
    expect(obj.url).toBe('https://httpbin.org/get')
    expect(_proxyConnects).toHaveLength(0)
  })

  it('proxyAuth not set in tunnel agent when authentication is not provided', async () => {
    process.env['https_proxy'] = 'http://127.0.0.1:8080'
    const httpClient = new httpm.HttpClient()
    const agent: any = httpClient.getAgent('https://some-url')
    // eslint-disable-next-line no-console
    console.log(agent)
    expect(agent.proxyOptions.host).toBe('127.0.0.1')
    expect(agent.proxyOptions.port).toBe('8080')
    expect(agent.proxyOptions.proxyAuth).toBe(undefined)
  })

  it('proxyAuth is set in tunnel agent when authentication is provided', async () => {
    process.env['https_proxy'] = 'http://user:password@127.0.0.1:8080'
    const httpClient = new httpm.HttpClient()
    const agent: any = httpClient.getAgent('https://some-url')
    // eslint-disable-next-line no-console
    console.log(agent)
    expect(agent.proxyOptions.host).toBe('127.0.0.1')
    expect(agent.proxyOptions.port).toBe('8080')
    expect(agent.proxyOptions.proxyAuth).toBe('user:password')
  })
})

function _clearVars(): void {
  delete process.env.http_proxy
  delete process.env.HTTP_PROXY
  delete process.env.https_proxy
  delete process.env.HTTPS_PROXY
  delete process.env.no_proxy
  delete process.env.NO_PROXY
}
