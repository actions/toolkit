import * as fs from 'fs'
import * as zlib from 'zlib'
import {
  getArtifactUrl,
  getDownloadRequestOptions,
  isSuccessStatusCode,
  isRetryableStatusCode,
  isThrottledStatusCode,
  getExponentialRetryTimeInMilliseconds,
  tryGetRetryAfterValueTimeInMilliseconds
} from './utils'
import {URL} from 'url'
import {StatusReporter} from './status-reporter'
import {performance} from 'perf_hooks'
import {ListArtifactsResponse, QueryArtifactResponse} from './contracts'
import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {HttpManager} from './http-manager'
import {DownloadItem} from './download-specification'
import {getDownloadFileConcurrency, getRetryLimit} from './config-variables'
import {info, debug} from '@actions/core'
import {IncomingHttpHeaders} from 'http'

export class DownloadHttpClient {
  // http manager is used for concurrent connections when downloading multiple files at once
  private downloadHttpManager: HttpManager
  private statusReporter: StatusReporter

  constructor() {
    this.downloadHttpManager = new HttpManager(getDownloadFileConcurrency())
    // downloads are usually significantly faster than uploads so display status information every second
    this.statusReporter = new StatusReporter(1000)
  }

  /**
   * Gets a list of all artifacts that are in a specific container
   */
  async listArtifacts(): Promise<ListArtifactsResponse> {
    const artifactUrl = getArtifactUrl()

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediately
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getDownloadRequestOptions('application/json')
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
    // the itemPath search parameter controls which containers will be returned
    const resourceUrl = new URL(containerUrl)
    resourceUrl.searchParams.append('itemPath', artifactName)

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediately
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getDownloadRequestOptions('application/json')
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
    // limit the number of files downloaded at a single time
    debug(`Download file concurrency is set to ${DOWNLOAD_CONCURRENCY}`)
    const parallelDownloads = [...new Array(DOWNLOAD_CONCURRENCY).keys()]
    let currentFile = 0
    let downloadedFiles = 0

    info(
      `Total number of files that will be downloaded: ${downloadItems.length}`
    )

    this.statusReporter.setTotalNumberOfFilesToProcess(downloadItems.length)
    this.statusReporter.start()

    await Promise.all(
      parallelDownloads.map(async index => {
        while (currentFile < downloadItems.length) {
          const currentFileToDownload = downloadItems[currentFile]
          currentFile += 1

          const startTime = performance.now()
          await this.downloadIndividualFile(
            index,
            currentFileToDownload.sourceLocation,
            currentFileToDownload.targetPath
          )

          debug(
            `File: ${++downloadedFiles}/${downloadItems.length}. ${
              currentFileToDownload.targetPath
            } took ${(performance.now() - startTime).toFixed(
              3
            )} milliseconds to finish downloading`
          )
          this.statusReporter.incrementProcessedCount()
        }
      })
    )
      .catch(error => {
        throw new Error(`###ERROR### Unable to download the artifact: ${error}`)
      })
      .finally(() => {
        this.statusReporter.stop()
        // safety dispose all connections
        this.downloadHttpManager.disposeAndReplaceAllClients()
      })
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
    let retryCount = 0
    const retryLimit = getRetryLimit()
    const destinationStream = fs.createWriteStream(downloadPath)
    const requestOptions = getDownloadRequestOptions(
      'application/json',
      true,
      true
    )

    // a single GET request is used to download a file
    const makeDownloadRequest = async (): Promise<IHttpClientResponse> => {
      const client = this.downloadHttpManager.getClient(httpClientIndex)
      return await client.get(artifactLocation, requestOptions)
    }

    // check the response headers to determine if the file was compressed using gzip
    const isGzip = (headers: IncomingHttpHeaders): boolean => {
      return (
        'content-encoding' in headers && headers['content-encoding'] === 'gzip'
      )
    }

    // Increments the current retry count and then checks if the retry limit has been reached
    // If there have been too many retries, fail so the download stops. If there is a retryAfterValue value provided,
    // it will be used
    const backOff = async (retryAfterValue?: number): Promise<void> => {
      retryCount++
      if (retryCount > retryLimit) {
        return Promise.reject(
          `Retry limit has been reached. Unable to download ${artifactLocation}`
        )
      } else {
        this.downloadHttpManager.disposeAndReplaceClient(httpClientIndex)
        if (retryAfterValue) {
          // Back off exponentially based off of the retry count
          info(
            `Backoff due to too many requests, retry #${retryCount}. Waiting for ${retryAfterValue} milliseconds before continuing the download`
          )
          await new Promise(resolve => setTimeout(resolve, retryAfterValue))
        } else {
          // Back off using an exponential value that depends on the retry count
          const backoffTime = getExponentialRetryTimeInMilliseconds(retryCount)
          info(
            `Exponential backoff for retry #${retryCount}. Waiting for ${backoffTime} milliseconds before continuing the download`
          )
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
        info(
          `Finished backoff for retry #${retryCount}, continuing with download`
        )
      }
    }

    // keep trying to download a file until a retry limit has been reached
    while (retryCount <= retryLimit) {
      let response: IHttpClientResponse
      try {
        response = await makeDownloadRequest()
      } catch (error) {
        // if an error is caught, it is usually indicative of a timeout so retry the download
        info('An error has been caught, while attempting to download a file')
        // eslint-disable-next-line no-console
        console.log(error)

        // increment the retryCount and use exponential backoff to wait before making the next request
        await backOff()
        continue
      }

      if (isSuccessStatusCode(response.message.statusCode)) {
        // The body contains the contents of the file however calling response.readBody() causes all the content to be converted to a string
        // which can cause some gzip encoded data to be lost
        // Instead of using response.readBody(), response.message is a readableStream that can be directly used to get the raw body contents
        return this.pipeResponseToFile(
          response,
          destinationStream,
          isGzip(response.message.headers)
        )
      } else if (isRetryableStatusCode(response.message.statusCode)) {
        info(
          `A ${response.message.statusCode} response code has been received while attempting to download an artifact`
        )
        // if a throttled status code is received, try to get the retryAfter header value, else differ to standard exponential backoff
        isThrottledStatusCode(response.message.statusCode)
          ? await backOff(
              tryGetRetryAfterValueTimeInMilliseconds(response.message.headers)
            )
          : await backOff()
      } else {
        // Some unexpected response code, fail immediately and stop the download
        return Promise.reject(
          `Unexpected http ${response.message.statusCode} during download for ${artifactLocation}`
        )
      }
    }
  }

  /**
   * Pipes the response from downloading an individual file to the appropriate destination stream while decoding gzip content if necessary
   * @param response the http response received when downloading a file
   * @param destinationStream the stream where the file should be written to
   * @param isGzip a boolean denoting if the content is compressed using gzip and if we need to decode it
   */
  async pipeResponseToFile(
    response: IHttpClientResponse,
    destinationStream: fs.WriteStream,
    isGzip: boolean
  ): Promise<void> {
    await new Promise((resolve, reject) => {
      if (isGzip) {
        const gunzip = zlib.createGunzip()
        response.message
          .pipe(gunzip)
          .pipe(destinationStream)
          .on('close', () => {
            resolve()
          })
          .on('error', error => {
            info(
              `An error has been encountered while gunzipping and writing a downloaded file to ${destinationStream.path}`
            )
            reject(error)
          })
      } else {
        response.message
          .pipe(destinationStream)
          .on('close', () => {
            resolve()
          })
          .on('error', error => {
            info(
              `An error has been encountered while writing a downloaded file to ${destinationStream.path}`
            )
            reject(error)
          })
      }
    })
    return
  }
}
