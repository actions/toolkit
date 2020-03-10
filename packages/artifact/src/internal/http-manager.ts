import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './utils'

/**
 * Used for managing concurrent http Connections during either upload or download in order to limit the number of tcp connections created
 * If an http call is made with the `keep-alive` header. Client disposal is necessary if a connection needed to be closed
 */
export class HttpManager {
  private clients: HttpClient[]

  constructor() {
    this.clients = []
  }

  createClients(concurrency: number): void {
    this.clients = new Array(concurrency).fill(createHttpClient())
  }

  getClient(index: number): HttpClient {
    return this.clients[index]
  }

  disposeClient(index: number): void {
    this.clients[index].dispose()
  }

  replaceClient(index: number): void {
    this.clients[index] = createHttpClient()
  }

  disposeAllConnections(): void {
    for (const client of this.clients) {
      client.dispose()
    }
  }
}
