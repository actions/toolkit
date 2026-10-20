import * as net from 'net'
import * as httpm from '..'

describe('request timeout cleanup', () => {
  let server: net.Server | undefined
  const serverSockets = new Set<net.Socket>()

  afterEach(async () => {
    for (const socket of serverSockets) {
      socket.destroy()
    }
    serverSockets.clear()

    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server?.close(error => (error ? reject(error) : resolve()))
      })
    }
    server = undefined
  })

  it('destroys the client socket when a request times out', async () => {
    server = net.createServer({allowHalfOpen: true}, socket => {
      serverSockets.add(socket)
      socket.on('data', () => undefined)
      socket.on('close', () => serverSockets.delete(socket))
    })
    await new Promise<void>((resolve, reject) => {
      server?.listen(0, '127.0.0.1', resolve)
      server?.once('error', reject)
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP server address')
    }

    const client = new httpm.HttpClient('http-client-timeout-test', [], {
      socketTimeout: 50
    })

    await expect(
      client.get(`http://127.0.0.1:${address.port}/jdk`)
    ).rejects.toThrow('Request timeout: /jdk')
    await new Promise(resolve => setTimeout(resolve, 250))

    const activeHandles = (
      process as NodeJS.Process & {_getActiveHandles(): unknown[]}
    )._getActiveHandles()
    const openClientSockets = activeHandles.filter(
      (handle): handle is net.Socket =>
        handle instanceof net.Socket &&
        handle.remotePort === address.port &&
        !handle.destroyed
    )
    expect(openClientSockets).toHaveLength(0)
  })
})
