import * as http from 'http'
import {HttpClient, HttpClientResponse} from '..'
import {Socket} from 'net'

describe.each(['readBody', 'readBodyBuffer'] as const)('%s', method => {
  function response(): HttpClientResponse {
    return new HttpClientResponse(new http.IncomingMessage(new Socket()))
  }

  async function read(res: HttpClientResponse): Promise<string | Buffer> {
    if (method === 'readBody') {
      return res.readBody()
    }
    if (!res.readBodyBuffer) {
      throw new Error(`Missing ${method}`)
    }
    return res.readBodyBuffer()
  }

  it('reads a complete response', async () => {
    const res = response()
    const body = read(res)
    res.message.push(Buffer.from('hello '))
    res.message.push(Buffer.from('world'))
    res.message.complete = true
    res.message.push(null)
    expect((await body).toString()).toBe('hello world')
  })

  it('reads an empty response', async () => {
    const res = response()
    const body = read(res)
    res.message.complete = true
    res.message.push(null)
    expect((await body).length).toBe(0)
  })

  it('rejects a response stream error', async () => {
    const res = response()
    const body = expect(read(res)).rejects.toThrow('body failed')
    res.message.destroy(new Error('body failed'))
    await body
  })

  it('rejects an aborted response', async () => {
    const res = response()
    const body = expect(read(res)).rejects.toThrow()
    res.message.destroy()
    await body
  })

  it('rejects premature closure after partial data', async () => {
    const res = response()
    const body = expect(read(res)).rejects.toThrow()
    res.message.push(Buffer.from('partial'))
    res.message.emit('close')
    await body
  })

  it('rejects when reading starts after the response was destroyed', async () => {
    const res = response()
    res.message.destroy()
    await new Promise(resolve => setImmediate(resolve))
    await expect(read(res)).rejects.toThrow()
  })

  it('rejects when a server disconnects after sending headers and partial data', async () => {
    const sockets = new Set<Socket>()
    const server = http.createServer((_req, res) => {
      res.writeHead(200, {'Content-Length': '100'})
      res.write('partial')
    })
    server.on('connection', socket => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    const client = new HttpClient()
    try {
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address')
      }
      const res = await client.get(`http://127.0.0.1:${address.port}/archive`)
      const body = expect(read(res)).rejects.toThrow()
      for (const socket of sockets) {
        socket.destroy()
      }
      await body
    } finally {
      client.dispose()
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
      })
    }
  })
})
