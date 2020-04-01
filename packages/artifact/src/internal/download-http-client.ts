import * as fs from 'fs'
import {
  getArtifactUrl,
  getRequestOptions,
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

export class DownloadHttpClient {
  // http manager is used for concurrent connections when downloading mulitple files at once
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

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediatly
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getRequestOptions('application/json', false)
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

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediatly
    const client = this.downloadHttpManager.getClient(0)
    const requestOptions = getRequestOptions('application/json', false)
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

    this.statusReporter.stop()
    // done downloading, safety dispose all connections
    this.downloadHttpManager.disposeAndReplaceAllClients()
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
    const requestOptions = getRequestOptions('application/octet-stream', true)

    // a single GET request is used to download a file
    const makeDownloadRequest = async (): Promise<IHttpClientResponse> => {
      const client = this.downloadHttpManager.getClient(httpClientIndex)
      return await client.get(artifactLocation, requestOptions)
    }

    requestOptions['Accept-Encoding'] = 'gzip'
    requestOptions['Accept'] =
      'application/octet-stream;api-version=6.0-preview;res-version=1'

    // checks if the retry limit has been reached. If there have been too many retries, fail so the download stops
    const checkRetryLimit = (response?: IHttpClientResponse): void => {
      if (retryCount > retryLimit) {
        if (response) {
          // eslint-disable-next-line no-console
          console.log(response)
        }
        throw new Error(
          `Unable to download ${artifactLocation}. Retry limit has been reached`
        )
      }
    }

    // Back off exponentially based off of the retry count.
    const backoffExponentially = async (): Promise<void> => {
      this.downloadHttpManager.disposeAndReplaceClient(httpClientIndex)
      const backoffTime = getExponentialRetryTimeInMilliseconds(retryCount)
      info(
        `Exponential backoff for retry #${retryCount}. Waiting for ${backoffTime} milliseconds before continuing the download`
      )
      await new Promise(resolve =>
        setTimeout(resolve, getExponentialRetryTimeInMilliseconds(retryCount))
      )
      info(
        `Finished exponential backoff for retry #${retryCount}, continuing with upload`
      )
      return
    }

    const backOffUsingRetryValue = async (
      retryAfterValue: number
    ): Promise<void> => {
      this.downloadHttpManager.disposeAndReplaceClient(httpClientIndex)
      info(
        `Backoff due to too many requests, retry #${retryCount}. Waiting for ${retryAfterValue} milliseconds before continuing the download`
      )
      await new Promise(resolve => setTimeout(resolve, retryAfterValue))
      info(
        `Finished backoff due to too many requests for retry #${retryCount}, continuing with upload`
      )
      return
    }

    while (retryCount <= retryLimit) {
      try {
        const response = await makeDownloadRequest()

        if (isSuccessStatusCode(response.message.statusCode)) {
          // The body contains the conents of the file, if it was uploaded using gzip, it will be decompressed by the @actions/http-client
          const body = await response.readBody()
          await this.pipeResponseToFile(body, downloadPath)
          return
        } else if (isThrottledStatusCode(response.message.statusCode)) {
          info(
            'A 429 response code has been recieved when attempting to download an artifact'
          )

          const retryAfterValue = tryGetRetryAfterValueTimeInMilliseconds(
            response.message.headers
          )
          if (retryAfterValue) {
            await backOffUsingRetryValue(retryAfterValue)
          } else {
            // no retry time available, differ to standard exponential backoff
            retryCount++
            checkRetryLimit(response)
            await backoffExponentially()
          }
        } else if (isRetryableStatusCode(response.message.statusCode)) {
          retryCount++
          checkRetryLimit(response)
          await backoffExponentially()
        } else {
          // Some unexpected response code, fail immediatly and stop the download
          // eslint-disable-next-line no-console
          console.log(response)
          break
        }
      } catch (error) {
        // if an error is catched, it is usually indicative of a timeout so retry the download
        info('An error has been caught, retrying the download')
        // eslint-disable-next-line no-console
        console.log(error)

        retryCount++
        checkRetryLimit()
        await backoffExponentially()
      }
    }
    throw new Error(`###ERROR### Unable to download ${artifactLocation} ###`)
  }

  /**
   * Writes the content of the response body to a file
   * @param body the decoded response body
   * @param destinationPath the path to the file that will contain the final downloaded content
   */
  private async pipeResponseToFile(
    body: string,
    destinationPath: string
  ): Promise<void> {
    await new Promise((resolve, reject) => {
      fs.writeFile(destinationPath, body, err => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(err)
          reject(err)
        }
        resolve()
      })
    })
    return
  }
}
