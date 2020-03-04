import * as fs from 'fs'
import * as zlib from 'zlib'
import {
  getArtifactUrl,
  getRequestOptions,
  isSuccessStatusCode,
  isRetryableStatusCode
} from './internal-utils'
import {URL} from 'url'
import {
  ListArtifactsResponse,
  QueryArtifactResponse
} from './internal-contracts'
import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {HttpManager} from './internal-http-manager'
import {DownloadItem} from './internal-download-specification'
import {getDownloadFileConcurrency} from './internal-config-variables'
import {warning} from '@actions/core'

export class DownloadHttpClient {
  private downloadHttpManager: HttpManager

  constructor() {
    this.downloadHttpManager = new HttpManager()
  }

  /**
   * Gets a list of all artifacts that are in a specific container
   */
  async listArtifacts(): Promise<ListArtifactsResponse> {
    const artifactUrl = getArtifactUrl()
    this.downloadHttpManager.createClients(1)
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getRequestOptions('application/json')

    const rawResponse = await client.get(artifactUrl, requestOptions)
    const body: string = await rawResponse.readBody()
    if (isSuccessStatusCode(rawResponse.message.statusCode) && body) {
      return JSON.parse(body)
    }
    // eslint-disable-next-line no-console
    console.log(rawResponse)
    throw new Error(`Unable to list artifacts for the run`)
  }

  /**
   * Fetches a set of container items that describe the contents of an artifact
   * @param artifactName the name of the artifact
   * @param containerUrl the artifact container URL for the run
   */
  async getContainerItems(
    artifactName: string,
    containerUrl: string
  ): Promise<QueryArtifactResponse> {
    // The itemPath search parameter controls which containers will be returned
    const resourceUrl = new URL(containerUrl)
    resourceUrl.searchParams.append('itemPath', artifactName)
    this.downloadHttpManager.createClients(1)
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getRequestOptions('application/json')
    const rawResponse = await client.get(resourceUrl.toString(), requestOptions)
    const body: string = await rawResponse.readBody()
    if (isSuccessStatusCode(rawResponse.message.statusCode) && body) {
      return JSON.parse(body)
    }
    // eslint-disable-next-line no-console
    console.log(rawResponse)
    throw new Error(`Unable to get ContainersItems from ${resourceUrl}`)
  }

  /**
   * Concurrently downloads all the files that are part of an artifact
   * @param downloadItems information about what items to download and where to save them
   */
  async downloadSingleArtifact(downloadItems: DownloadItem[]): Promise<void> {
    const DOWNLOAD_CONCURRENCY = getDownloadFileConcurrency()
    // Limit the number of files downloaded at a single time
    const parallelDownloads = [...new Array(DOWNLOAD_CONCURRENCY).keys()]
    this.downloadHttpManager.createClients(DOWNLOAD_CONCURRENCY)
    let downloadedFiles = 0
    await Promise.all(
      parallelDownloads.map(async index => {
        while (downloadedFiles < downloadItems.length) {
          const currentFileToDownload = downloadItems[downloadedFiles]
          downloadedFiles += 1
          await this.downloadIndividualFile(
            index,
            currentFileToDownload.sourceLocation,
            currentFileToDownload.targetPath
          )
        }
      })
    )

    // done downloading, safety dispose all connections
    this.downloadHttpManager.disposeAllConnections()
  }

  /**
   * Downloads an individual file
   * @param httpClientIndex the index of the http client that is used to make all of the calls
   * @param artifactLocation origin location where a file will be downloaded from
   * @param downloadPath destination location for the file being downloaded
   */
  private async downloadIndividualFile(
    httpClientIndex: number,
    artifactLocation: string,
    downloadPath: string
  ): Promise<void> {
    const stream = fs.createWriteStream(downloadPath)
    const client = this.downloadHttpManager.getClient(httpClientIndex)
    const requestOptions = getRequestOptions('application/octet-stream', true)
    const response = await client.get(artifactLocation, requestOptions)
    let isGzip = false
    if (
      response.message.headers['content-encoding'] &&
      response.message.headers['content-encoding'] === 'gzip'
    ) {
      isGzip = true
    }
    if (isSuccessStatusCode(response.message.statusCode)) {
      await this.pipeResponseToStream(response, stream, isGzip)
    } else if (isRetryableStatusCode(response.message.statusCode)) {
      warning(
        `Received http ${response.message.statusCode} during file download, will retry ${artifactLocation} after 10 seconds`
      )
      // If an error is encountered, dispose of the http connection, wait, and create a new one
      this.downloadHttpManager.disposeClient(httpClientIndex)
      await new Promise(resolve => setTimeout(resolve, 10000))
      this.downloadHttpManager.replaceClient(httpClientIndex)
      const retryResponse = await client.get(artifactLocation)
      if (isSuccessStatusCode(retryResponse.message.statusCode)) {
        if (
          response.message.headers['content-encoding'] &&
          response.message.headers['content-encoding'] === 'gzip'
        ) {
          isGzip = true
        } else {
          isGzip = false
        }
        await this.pipeResponseToStream(response, stream, isGzip)
      } else {
        // eslint-disable-next-line no-console
        console.log(retryResponse)
        throw new Error(`Unable to download ${artifactLocation}`)
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(response)
      throw new Error(`Unable to download ${artifactLocation}`)
    }
  }

  /**
   * Pipes the response from downloading an individual file to the appropriate stream
   * @param response the http response recieved when downloading a file
   * @param stream the stream where the file should be written to
   * @param isGzip does the response need to be be uncompressed
   */
  private async pipeResponseToStream(
    response: IHttpClientResponse,
    stream: NodeJS.WritableStream,
    isGzip: boolean
  ): Promise<void> {
    return new Promise(resolve => {
      if (isGzip) {
        // pipe the response into gunzip to decompress
        const gunzip = zlib.createGunzip()
        response.message
          .pipe(gunzip)
          .pipe(stream)
          .on('close', () => {
            resolve()
          })
      } else {
        response.message.pipe(stream).on('close', () => {
          resolve()
        })
      }
    })
  }
}
