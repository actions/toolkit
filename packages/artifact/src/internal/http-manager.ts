import {HttpClient} from '@actions/http-client/index'
import {createHttpClient} from './utils'
import {info} from '@actions/core'

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
  // this should be called if a connection gets reset, timeouts or gets dropped for some unexpected reason and we would like to retry
  // for more information see: https://github.com/actions/http-client/blob/04e5ad73cd3fd1f5610a32116b0759eddf6570d2/index.ts#L292
  disposeAndReplaceClient(index: number): void {
    info(`disposing and replacing http client ${index}`)
    this.clients[index].dispose()
    this.clients[index] = createHttpClient()
  }

  disposeAllClients(): void {
    for (const [index] of this.clients.entries()) {
      this.clients[index].dispose()
    }
  }
}
