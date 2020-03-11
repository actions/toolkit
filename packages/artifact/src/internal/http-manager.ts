import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './utils'

/**
 * Used for managing http clients during either upload or download. The standard client is used for connections/calls that can be
 * closed immediatly while concurrent clients can be kept open using keep alive to maintain a persistent connection
 */
export class HttpManager {
  private standardClient: HttpClient
  private concurrentClients: HttpClient[]

  constructor(concurrency: number) {
    this.standardClient = createHttpClient()
    this.concurrentClients = new Array(concurrency).fill(createHttpClient())
  }

  getStandardClient(): HttpClient {
    return this.standardClient
  }

  getConcurrentClient(index: number): HttpClient {
    return this.concurrentClients[index]
  }

  // client disposal is necessary if a keep-alive connection is used to properly close the connection
  // for more information see: https://github.com/actions/http-client/blob/04e5ad73cd3fd1f5610a32116b0759eddf6570d2/index.ts#L292
  disposeAndReplaceConcurrentClient(index: number): void {
    this.concurrentClients[index].dispose()
    this.concurrentClients[index] = createHttpClient()
  }

  disposeAllConcurrentClients(): void {
    for (const client of this.concurrentClients) {
      client.dispose()
    }
  }
}
