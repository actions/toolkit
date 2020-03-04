import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './internal-utils'

/**
 * Used for managing all http Connections during either upload or download in order to limit the number of tcp connections created
 * Separate clients for download and upload are used so that there are no conflicts if both are used at the same time
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
