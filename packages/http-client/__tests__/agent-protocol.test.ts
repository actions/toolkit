import * as http from 'http'
import * as https from 'https'
import {AddressInfo} from 'net'
import {HttpClient} from '../lib'

describe('direct agent protocol', () => {
  it.each([
    [false, 'http:', 'https:'],
    [false, 'https:', 'http:'],
    [true, 'http:', 'https:'],
    [true, 'https:', 'http:']
  ])(
    'keeps agents separate with keepAlive=%s and %s followed by %s',
    (keepAlive, firstProtocol, secondProtocol) => {
      const client = new HttpClient('agent-tests', [], {keepAlive})
      try {
        const first = client.getAgent(`${firstProtocol}//127.0.0.1`)
        const second = client.getAgent(`${secondProtocol}//127.0.0.1`)

        expect(first).toHaveProperty('protocol', firstProtocol)
        expect(second).toHaveProperty('protocol', secondProtocol)
        expect(first).not.toBe(second)
        expect(client.getAgent(`${firstProtocol}//127.0.0.1/again`)).toBe(first)
        expect(client.getAgent(`${secondProtocol}//127.0.0.1/again`)).toBe(
          second
        )
        expect(first).toHaveProperty('keepAlive', keepAlive)
        expect(second).toHaveProperty('keepAlive', keepAlive)
      } finally {
        client.dispose()
      }
    }
  )

  it('retains TLS and socket options when HTTP is used first', () => {
    const client = new HttpClient('agent-tests', [], {
      keepAlive: true,
      maxSockets: 7,
      ignoreSslError: true
    })
    try {
      const plain = client.getAgent('http://127.0.0.1')
      const secure = client.getAgent('https://127.0.0.1') as https.Agent

      expect(secure).toBeInstanceOf(https.Agent)
      expect(secure.options.rejectUnauthorized).toBe(false)
      expect(plain.maxSockets).toBe(7)
      expect(secure.maxSockets).toBe(7)
    } finally {
      client.dispose()
    }
  })

  it('destroys both cached direct agents on dispose', () => {
    const client = new HttpClient('agent-tests', [], {keepAlive: true})
    const plain = client.getAgent('http://127.0.0.1')
    const secure = client.getAgent('https://127.0.0.1')
    const destroyPlain = jest.spyOn(plain, 'destroy')
    const destroySecure = jest.spyOn(secure, 'destroy')

    client.dispose()

    expect(destroyPlain).toHaveBeenCalledTimes(1)
    expect(destroySecure).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])(
    'can make an HTTP request after preparing HTTPS with keepAlive=%s',
    async keepAlive => {
      const server = http.createServer((_request, response) =>
        response.end('ok')
      )
      const client = new HttpClient('agent-tests', [], {keepAlive})
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

      try {
        client.getAgent('https://127.0.0.1')
        const {port} = server.address() as AddressInfo
        const response = await client.get(`http://127.0.0.1:${port}/`)

        expect(response.message.statusCode).toBe(200)
        expect(await response.readBody()).toBe('ok')
      } finally {
        client.dispose()
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve()))
        )
      }
    }
  )
})
