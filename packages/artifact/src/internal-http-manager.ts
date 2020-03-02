import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './internal-utils'

/**
 * Used for managing httpClients in order to limit the number of tcp connections created
 */
export class HttpManager {
  private static _instance: HttpManager = new HttpManager()
  private clients: HttpClient[]

  constructor() {
    if (HttpManager._instance) {
      throw new Error('Error: Singleton HttpManager already instantiated')
    }
    HttpManager._instance = this
    this.clients = []
  }

  static getInstance(): HttpManager {
    return HttpManager._instance
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
