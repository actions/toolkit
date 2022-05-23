import * as fs from 'fs'
import * as core from '@actions/core'
import * as tmp from 'tmp-promise'
import * as stream from 'stream'
import {
  ArtifactResponse,
  CreateArtifactParameters,
  PatchArtifactSize,
  UploadResults
} from './contracts'
import {
  digestForStream,
  getArtifactUrl,
  getContentRange,
  getUploadHeaders,
  isRetryableStatusCode,
  isSuccessStatusCode,
  isThrottledStatusCode,
  displayHttpDiagnostics,
  getExponentialRetryTimeInMilliseconds,
  tryGetRetryAfterValueTimeInMilliseconds,
  getProperRetention,
  sleep
} from './utils'
import {
  getUploadChunkSize,
  getUploadFileConcurrency,
  getRetryLimit,
  getRetentionDays
} from './config-variables'
import {promisify} from 'util'
import {URL} from 'url'
import {performance} from 'perf_hooks'
import {StatusReporter} from './status-reporter'
import {HttpCodes, HttpClientResponse} from '@actions/http-client'
import {HttpManager} from './http-manager'
import {UploadSpecification} from './upload-specification'
import {UploadOptions} from './upload-options'
import {createGZipFileOnDisk, createGZipFileInBuffer} from './upload-gzip'
import {retryHttpClientRequest} from './requestUtils'
const stat = promisify(fs.stat)

export class UploadHttpClient {
  private uploadHttpManager: HttpManager
  private statusReporter: StatusReporter

  constructor() {
    this.uploadHttpManager = new HttpManager(
      getUploadFileConcurrency(),
      '@actions/artifact-upload'
    )
    this.statusReporter = new StatusReporter(10000)
  }

  /**
   * Creates a file container for the new artifact in the remote blob storage/file service
   * @param {string} artifactName Name of the artifact being created
   * @returns The response from the Artifact Service if the file container was successfully created
   */
  async createArtifactInFileContainer(
    artifactName: string,
    options?: UploadOptions | undefined
  ): Promise<ArtifactResponse> {
    const parameters: CreateArtifactParameters = {
      Type: 'actions_storage',
      Name: artifactName
    }

    // calculate retention period
    if (options && options.retentionDays) {
      const maxRetentionStr = getRetentionDays()
      parameters.RetentionDays = getProperRetention(
        options.retentionDays,
        maxRetentionStr
      )
    }

    const data: string = JSON.stringify(parameters, null, 2)
    const artifactUrl = getArtifactUrl()

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediately
    const client = this.uploadHttpManager.getClient(0)
    const headers = getUploadHeaders('application/json', false)

    // Extra information to display when a particular HTTP code is returned
    // If a 403 is returned when trying to create a file container, the customer has exceeded
    // their storage quota so no new artifact containers can be created
    const customErrorMessages: Map<number, string> = new Map([
      [
        HttpCodes.Forbidden,
        'Artifact storage quota has been hit. Unable to upload any new artifacts'
      ],
      [
        HttpCodes.BadRequest,
        `The artifact name ${artifactName} is not valid. Request URL ${artifactUrl}`
      ]
    ])

    const response = await retryHttpClientRequest(
      'Create Artifact Container',
      async () => client.post(artifactUrl, data, headers),
      customErrorMessages
    )
    const body: string = await response.readBody()
    return JSON.parse(body)
  }

  /**
   * Concurrently upload all of the files in chunks
   * @param {string} uploadUrl Base Url for the artifact that was created
   * @param {SearchResult[]} filesToUpload A list of information about the files being uploaded
   * @returns The size of all the files uploaded in bytes
   */
  async uploadArtifactToFileContainer(
    uploadUrl: string,
    filesToUpload: UploadSpecification[],
    options?: UploadOptions
  ): Promise<UploadResults> {
    const FILE_CONCURRENCY = getUploadFileConcurrency()
    const MAX_CHUNK_SIZE = getUploadChunkSize()
    core.debug(
      `File Concurrency: ${FILE_CONCURRENCY}, and Chunk Size: ${MAX_CHUNK_SIZE}`
    )

    const parameters: UploadFileParameters[] = []
    // by default, file uploads will continue if there is an error unless specified differently in the options
    let continueOnError = true
    if (options) {
      if (options.continueOnError === false) {
        continueOnError = false
      }
    }

    // prepare the necessary parameters to upload all the files
    for (const file of filesToUpload) {
      const resourceUrl = new URL(uploadUrl)
      resourceUrl.searchParams.append('itemPath', file.uploadFilePath)
      parameters.push({
        file: file.absoluteFilePath,
        resourceUrl: resourceUrl.toString(),
        maxChunkSize: MAX_CHUNK_SIZE,
        continueOnError
      })
    }

    const parallelUploads = [...new Array(FILE_CONCURRENCY).keys()]
    const failedItemsToReport: string[] = []
    let currentFile = 0
    let completedFiles = 0
    let uploadFileSize = 0
    let totalFileSize = 0
    let abortPendingFileUploads = false

    this.statusReporter.setTotalNumberOfFilesToProcess(filesToUpload.length)
    this.statusReporter.start()

    // only allow a certain amount of files to be uploaded at once, this is done to reduce potential errors
    await Promise.all(
      parallelUploads.map(async index => {
        while (currentFile < filesToUpload.length) {
          const currentFileParameters = parameters[currentFile]
          currentFile += 1
          if (abortPendingFileUploads) {
            failedItemsToReport.push(currentFileParameters.file)
            continue
          }

          const startTime = performance.now()
          const uploadFileResult = await this.uploadFileAsync(
            index,
            currentFileParameters
          )

          if (core.isDebug()) {
            core.debug(
              `File: ${++completedFiles}/${filesToUpload.length}. ${
                currentFileParameters.file
              } took ${(performance.now() - startTime).toFixed(
                3
              )} milliseconds to finish upload`
            )
          }

          uploadFileSize += uploadFileResult.successfulUploadSize
          totalFileSize += uploadFileResult.totalSize
          if (uploadFileResult.isSuccess === false) {
            failedItemsToReport.push(currentFileParameters.file)
            if (!continueOnError) {
              // fail fast
              core.error(`aborting artifact upload`)
              abortPendingFileUploads = true
            }
          }
          this.statusReporter.incrementProcessedCount()
        }
      })
    )

    this.statusReporter.stop()
    // done uploading, safety dispose all connections
    this.uploadHttpManager.disposeAndReplaceAllClients()

    core.info(`Total size of all the files uploaded is ${uploadFileSize} bytes`)
    return {
      uploadSize: uploadFileSize,
      totalSize: totalFileSize,
      failedItems: failedItemsToReport
    }
  }

  /**
   * Asynchronously uploads a file. The file is compressed and uploaded using GZip if it is determined to save space.
   * If the upload file is bigger than the max chunk size it will be uploaded via multiple calls
   * @param {number} httpClientIndex The index of the httpClient that is being used to make all of the calls
   * @param {UploadFileParameters} parameters Information about the file that needs to be uploaded
   * @returns The size of the file that was uploaded in bytes along with any failed uploads
   */
  private async uploadFileAsync(
    httpClientIndex: number,
    parameters: UploadFileParameters
  ): Promise<UploadFileResult> {
    const fileStat: fs.Stats = await stat(parameters.file)
    const totalFileSize = fileStat.size
    const isFIFO = fileStat.isFIFO()
    let offset = 0
    let isUploadSuccessful = true
    let failedChunkSizes = 0
    let uploadFileSize = 0
    let isGzip = true

    // the file that is being uploaded is less than 64k in size to increase throughput and to minimize disk I/O
    // for creating a new GZip file, an in-memory buffer is used for compression
    // with named pipes the file size is reported as zero in that case don't read the file in memory
    if (!isFIFO && totalFileSize < 65536) {
      core.debug(
        `${parameters.file} is less than 64k in size. Creating a gzip file in-memory to potentially reduce the upload size`
      )
      const buffer = await createGZipFileInBuffer(parameters.file)

      // An open stream is needed in the event of a failure and we need to retry. If a NodeJS.ReadableStream is directly passed in,
      // it will not properly get reset to the start of the stream if a chunk upload needs to be retried
      let openUploadStream: () => NodeJS.ReadableStream

      if (totalFileSize < buffer.byteLength) {
        // compression did not help with reducing the size, use a readable stream from the original file for upload
        core.debug(
          `The gzip file created for ${parameters.file} did not help with reducing the size of the file. The original file will be uploaded as-is`
        )
        openUploadStream = () => fs.createReadStream(parameters.file)
        isGzip = false
        uploadFileSize = totalFileSize
      } else {
        // create a readable stream using a PassThrough stream that is both readable and writable
        core.debug(
          `A gzip file created for ${parameters.file} helped with reducing the size of the original file. The file will be uploaded using gzip.`
        )
        openUploadStream = () => {
          const passThrough = new stream.PassThrough()
          passThrough.end(buffer)
          return passThrough
        }
        uploadFileSize = buffer.byteLength
      }

      const result = await this.uploadChunk(
        httpClientIndex,
        parameters.resourceUrl,
        openUploadStream,
        0,
        uploadFileSize - 1,
        uploadFileSize,
        isGzip,
        totalFileSize
      )

      if (!result) {
        // chunk failed to upload
        isUploadSuccessful = false
        failedChunkSizes += uploadFileSize
        core.warning(`Aborting upload for ${parameters.file} due to failure`)
      }

      return {
        isSuccess: isUploadSuccessful,
        successfulUploadSize: uploadFileSize - failedChunkSizes,
        totalSize: totalFileSize
      }
    } else {
      // the file that is being uploaded is greater than 64k in size, a temporary file gets created on disk using the
      // npm tmp-promise package and this file gets used to create a GZipped file
      const tempFile = await tmp.file()
      core.debug(
        `${parameters.file} is greater than 64k in size. Creating a gzip file on-disk ${tempFile.path} to potentially reduce the upload size`
      )

      // create a GZip file of the original file being uploaded, the original file should not be modified in any way
      uploadFileSize = await createGZipFileOnDisk(
        parameters.file,
        tempFile.path
      )

      let uploadFilePath = tempFile.path

      // compression did not help with size reduction, use the original file for upload and delete the temp GZip file
      // for named pipes totalFileSize is zero, this assumes compression did help
      if (!isFIFO && totalFileSize < uploadFileSize) {
        core.debug(
          `The gzip file created for ${parameters.file} did not help with reducing the size of the file. The original file will be uploaded as-is`
        )
        uploadFileSize = totalFileSize
        uploadFilePath = parameters.file
        isGzip = false
      } else {
        core.debug(
          `The gzip file created for ${parameters.file} is smaller than the original file. The file will be uploaded using gzip.`
        )
      }

      let abortFileUpload = false
      // upload only a single chunk at a time
      while (offset < uploadFileSize) {
        const chunkSize = Math.min(
          uploadFileSize - offset,
          parameters.maxChunkSize
        )

        const startChunkIndex = offset
        const endChunkIndex = offset + chunkSize - 1
        offset += parameters.maxChunkSize

        if (abortFileUpload) {
          // if we don't want to continue in the event of an error, any pending upload chunks will be marked as failed
          failedChunkSizes += chunkSize
          continue
        }

        const result = await this.uploadChunk(
          httpClientIndex,
          parameters.resourceUrl,
          () =>
            fs.createReadStream(uploadFilePath, {
              start: startChunkIndex,
              end: endChunkIndex,
              autoClose: false
            }),
          startChunkIndex,
          endChunkIndex,
          uploadFileSize,
          isGzip,
          totalFileSize
        )

        if (!result) {
          // Chunk failed to upload, report as failed and do not continue uploading any more chunks for the file. It is possible that part of a chunk was
          // successfully uploaded so the server may report a different size for what was uploaded
          isUploadSuccessful = false
          failedChunkSizes += chunkSize
          core.warning(`Aborting upload for ${parameters.file} due to failure`)
          abortFileUpload = true
        } else {
          // if an individual file is greater than 8MB (1024*1024*8) in size, display extra information about the upload status
          if (uploadFileSize > 8388608) {
            this.statusReporter.updateLargeFileStatus(
              parameters.file,
              startChunkIndex,
              endChunkIndex,
              uploadFileSize
            )
          }
        }
      }

      // Delete the temporary file that was created as part of the upload. If the temp file does not get manually deleted by
      // calling cleanup, it gets removed when the node process exits. For more info see: https://www.npmjs.com/package/tmp-promise#about
      core.debug(`deleting temporary gzip file ${tempFile.path}`)
      await tempFile.cleanup()

      return {
        isSuccess: isUploadSuccessful,
        successfulUploadSize: uploadFileSize - failedChunkSizes,
        totalSize: totalFileSize
      }
    }
  }

  /**
   * Uploads a chunk of an individual file to the specified resourceUrl. If the upload fails and the status code
   * indicates a retryable status, we try to upload the chunk as well
   * @param {number} httpClientIndex The index of the httpClient being used to make all the necessary calls
   * @param {string} resourceUrl Url of the resource that the chunk will be uploaded to
   * @param {NodeJS.ReadableStream} openStream Stream of the file that will be uploaded
   * @param {number} start Starting byte index of file that the chunk belongs to
   * @param {number} end Ending byte index of file that the chunk belongs to
   * @param {number} uploadFileSize Total size of the file in bytes that is being uploaded
   * @param {boolean} isGzip Denotes if we are uploading a Gzip compressed stream
   * @param {number} totalFileSize Original total size of the file that is being uploaded
   * @returns if the chunk was successfully uploaded
   */
  private async uploadChunk(
    httpClientIndex: number,
    resourceUrl: string,
    openStream: () => NodeJS.ReadableStream,
    start: number,
    end: number,
    uploadFileSize: number,
    isGzip: boolean,
    totalFileSize: number
  ): Promise<boolean> {
    // open a new stream and read it to compute the digest
    const digest = await digestForStream(openStream())

    // prepare all the necessary headers before making any http call
    const headers = getUploadHeaders(
      'application/octet-stream',
      true,
      isGzip,
      totalFileSize,
      end - start + 1,
      getContentRange(start, end, uploadFileSize),
      digest
    )

    const uploadChunkRequest = async (): Promise<HttpClientResponse> => {
      const client = this.uploadHttpManager.getClient(httpClientIndex)
      return await client.sendStream('PUT', resourceUrl, openStream(), headers)
    }

    let retryCount = 0
    const retryLimit = getRetryLimit()

    // Increments the current retry count and then checks if the retry limit has been reached
    // If there have been too many retries, fail so the download stops
    const incrementAndCheckRetryLimit = (
      response?: HttpClientResponse
    ): boolean => {
      retryCount++
      if (retryCount > retryLimit) {
        if (response) {
          displayHttpDiagnostics(response)
        }
        core.info(
          `Retry limit has been reached for chunk at offset ${start} to ${resourceUrl}`
        )
        return true
      }
      return false
    }

    const backOff = async (retryAfterValue?: number): Promise<void> => {
      this.uploadHttpManager.disposeAndReplaceClient(httpClientIndex)
      if (retryAfterValue) {
        core.info(
          `Backoff due to too many requests, retry #${retryCount}. Waiting for ${retryAfterValue} milliseconds before continuing the upload`
        )
        await sleep(retryAfterValue)
      } else {
        const backoffTime = getExponentialRetryTimeInMilliseconds(retryCount)
        core.info(
          `Exponential backoff for retry #${retryCount}. Waiting for ${backoffTime} milliseconds before continuing the upload at offset ${start}`
        )
        await sleep(backoffTime)
      }
      core.info(
        `Finished backoff for retry #${retryCount}, continuing with upload`
      )
      return
    }

    // allow for failed chunks to be retried multiple times
    while (retryCount <= retryLimit) {
      let response: HttpClientResponse

      try {
        response = await uploadChunkRequest()
      } catch (error) {
        // if an error is caught, it is usually indicative of a timeout so retry the upload
        core.info(
          `An error has been caught http-client index ${httpClientIndex}, retrying the upload`
        )
        // eslint-disable-next-line no-console
        console.log(error)

        if (incrementAndCheckRetryLimit()) {
          return false
        }
        await backOff()
        continue
      }

      // Always read the body of the response. There is potential for a resource leak if the body is not read which will
      // result in the connection remaining open along with unintended consequences when trying to dispose of the client
      await response.readBody()

      if (isSuccessStatusCode(response.message.statusCode)) {
        return true
      } else if (isRetryableStatusCode(response.message.statusCode)) {
        core.info(
          `A ${response.message.statusCode} status code has been received, will attempt to retry the upload`
        )
        if (incrementAndCheckRetryLimit(response)) {
          return false
        }
        isThrottledStatusCode(response.message.statusCode)
          ? await backOff(
              tryGetRetryAfterValueTimeInMilliseconds(response.message.headers)
            )
          : await backOff()
      } else {
        core.error(
          `Unexpected response. Unable to upload chunk to ${resourceUrl}`
        )
        displayHttpDiagnostics(response)
        return false
      }
    }
    return false
  }

  /**
   * Updates the size of the artifact from -1 which was initially set when the container was first created for the artifact.
   * Updating the size indicates that we are done uploading all the contents of the artifact
   */
  async patchArtifactSize(size: number, artifactName: string): Promise<void> {
    const resourceUrl = new URL(getArtifactUrl())
    resourceUrl.searchParams.append('artifactName', artifactName)

    const parameters: PatchArtifactSize = {Size: size}
    const data: string = JSON.stringify(parameters, null, 2)
    core.debug(`URL is ${resourceUrl.toString()}`)

    // use the first client from the httpManager, `keep-alive` is not used so the connection will close immediately
    const client = this.uploadHttpManager.getClient(0)
    const headers = getUploadHeaders('application/json', false)

    // Extra information to display when a particular HTTP code is returned
    const customErrorMessages: Map<number, string> = new Map([
      [
        HttpCodes.NotFound,
        `An Artifact with the name ${artifactName} was not found`
      ]
    ])

    // TODO retry for all possible response codes, the artifact upload is pretty much complete so it at all costs we should try to finish this
    const response = await retryHttpClientRequest(
      'Finalize artifact upload',
      async () => client.patch(resourceUrl.toString(), data, headers),
      customErrorMessages
    )
    await response.readBody()
    core.debug(
      `Artifact ${artifactName} has been successfully uploaded, total size in bytes: ${size}`
    )
  }
}

interface UploadFileParameters {
  file: string
  resourceUrl: string
  maxChunkSize: number
  continueOnError: boolean
}

interface UploadFileResult {
  isSuccess: boolean
  successfulUploadSize: number
  totalSize: number
}
