import {HttpClient} from '@actions/http-client'
import {createHttpClient} from './utils'

/**
 * Used for managing http clients during either upload or download
 */
export class HttpManager {
  private clients: HttpClient[]
  private userAgent: string

  constructor(clientCount: number, userAgent: string) {
    if (clientCount < 1) {
      throw new Error('There must be at least one client')
    }
    this.userAgent = userAgent
    this.clients = new Array(clientCount).fill(createHttpClient(userAgent))
  }

  getClient(index: number): HttpClient {
    return this.clients[index]
  }

  // client disposal is necessary if a keep-alive connection is used to properly close the connection
  // for more information see: https://github.com/actions/http-client/blob/04e5ad73cd3fd1f5610a32116b0759eddf6570d2/index.ts#L292
  disposeAndReplaceClient(index: number): void {
    this.clients[index].dispose()
    this.clients[index] = createHttpClient(this.userAgent)
  }

  disposeAndReplaceAllClients(): void {
    for (const [index] of this.clients.entries()) {
      this.disposeAndReplaceClient(index)
    }
  }
}
