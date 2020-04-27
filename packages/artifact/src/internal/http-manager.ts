import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './utils'

/**
 * Used for managing http clients during either upload or download
 */
export class HttpManager {
  private clients: HttpClient[]

  constructor(clientCount: number) {
    if (clientCount < 1) {
      throw new Error('There must be at least one client')
    }
    this.clients = new Array(clientCount).fill(createHttpClient())
  }

  getClient(index: number): HttpClient {
    return this.clients[index]
  }

  // client disposal is necessary if a keep-alive connection is used to properly close the connection
  disposeAllClients(): void {
    for (const [index] of this.clients.entries()) {
      this.clients[index].dispose()
    }
  }
}
