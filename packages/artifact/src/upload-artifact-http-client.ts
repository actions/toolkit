import {debug} from '@actions/core'
import {HttpClientResponse, HttpClient} from '@actions/http-client/index'
import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {
  CreateArtifactResponse,
  CreateArtifactParameters,
  PatchArtifactSize,
  PatchArtifactSizeSuccessResponse,
  UploadResults
} from './contracts'
import * as fs from 'fs'
import {SearchResult} from './search'
import {UploadOptions} from './upload-options'
import {URL} from 'url'
import {
  createHttpClient,
  getArtifactUrl,
  getContentRange,
  getRequestOptions,
  isRetryableStatusCode,
  isSuccessStatusCode,
  parseEnvNumber
} from './utils'
import {getRuntimeToken, getRuntimeUrl, getWorkFlowRunId} from './env-variables'

const defaultChunkUploadConcurrency = 3
const defaultFileUploadConcurrency = 2

/**
 * Creates a file container for the new artifact in the remote blob storage/file service
 * @param {string} artifactName Name of the artifact being created
 * @returns The response from the Artifact Service if the file container was successfully created
 */
export async function createArtifactInFileContainer(
  artifactName: string
): Promise<CreateArtifactResponse> {
  const parameters: CreateArtifactParameters = {
    Type: 'actions_storage',
    Name: artifactName
  }
  const data: string = JSON.stringify(parameters, null, 2)
  const artifactUrl = getArtifactUrl(getRuntimeUrl(), getWorkFlowRunId())
  const client = createHttpClient(getRuntimeToken())
  const requestOptions = getRequestOptions('application/json')

  const rawResponse = await client.post(artifactUrl, data, requestOptions)
  const body: string = await rawResponse.readBody()

  if (
    rawResponse.message.statusCode &&
    isSuccessStatusCode(rawResponse.message.statusCode) &&
    body
  ) {
    return JSON.parse(body)
  } else {
    // eslint-disable-next-line no-console
    console.log(rawResponse)
    throw new Error(
      `Unable to create a container for the artifact ${artifactName}`
    )
  }
}

/**
 * Concurrently upload all of the files in chunks
 * @param {string} uploadUrl Base Url for the artifact that was created
 * @param {SearchResult[]} filesToUpload A list of information about the files being uploaded
 * @returns The size of all the files uploaded in bytes
 */
export async function uploadArtifactToFileContainer(
  uploadUrl: string,
  filesToUpload: SearchResult[],
  options?: UploadOptions
): Promise<UploadResults> {
  const client = createHttpClient(getRuntimeToken())

  const FILE_CONCURRENCY =
    parseEnvNumber('ARTIFACT_FILE_UPLOAD_CONCURRENCY') ||
    defaultFileUploadConcurrency
  const CHUNK_CONCURRENCY =
    parseEnvNumber('ARTIFACT_CHUNK_UPLOAD_CONCURRENCY') ||
    defaultChunkUploadConcurrency
  const MAX_CHUNK_SIZE =
    parseEnvNumber('ARTIFACT_UPLOAD_CHUNK_SIZE') || 4 * 1024 * 1024 // 4 MB Chunks
  debug(
    `File Concurrency: ${FILE_CONCURRENCY}, Chunk Concurrency: ${CHUNK_CONCURRENCY} and Chunk Size: ${MAX_CHUNK_SIZE}`
  )

  const parameters: UploadFileParameters[] = []
  const continueOnError = options?.continueOnError || true

  // Prepare the necessary parameters to upload all the files
  for (const file of filesToUpload) {
    const resourceUrl = new URL(uploadUrl)
    resourceUrl.searchParams.append(
      'scope',
      '00000000-0000-0000-0000-000000000000'
    )
    resourceUrl.searchParams.append('itemPath', file.uploadFilePath)
    parameters.push({
      file: file.absoluteFilePath,
      resourceUrl: resourceUrl.toString(),
      restClient: client,
      concurrency: CHUNK_CONCURRENCY,
      maxChunkSize: MAX_CHUNK_SIZE,
      continueOnError
    })
  }

  const parallelUploads = [...new Array(FILE_CONCURRENCY).keys()]
  const failedItemsToReport: string[] = []
  let uploadedFiles = 0
  let fileSizes = 0
  let abortPendingFileUploads = false

  // Only allow a certain amount of files to be uploaded at once, this is done to reduce potential errors
  await Promise.all(
    parallelUploads.map(async () => {
      while (uploadedFiles < filesToUpload.length) {
        const currentFileParameters = parameters[uploadedFiles]
        uploadedFiles += 1
        if (abortPendingFileUploads) {
          failedItemsToReport.push(currentFileParameters.file)
          continue
        }

        const uploadFileResult = await uploadFileAsync(currentFileParameters)
        fileSizes += uploadFileResult.successfulUploadSize
        if (uploadFileResult.isSuccess === false) {
          failedItemsToReport.push(currentFileParameters.file)
          if (!continueOnError) {
            // Existing uploads will be able to finish however all pending uploads will fail fast
            abortPendingFileUploads = true
          }
        }
      }
    })
  )

  // eslint-disable-next-line no-console
  console.log(`Total size of all the files uploaded ${fileSizes}`)
  return {
    size: fileSizes,
    failedItems: failedItemsToReport
  }
}

/**
 * Asynchronously uploads a file. If the file is bigger than the max chunk size it will be uploaded via multiple calls
 * @param {UploadFileParameters} parameters Information about the file that needs to be uploaded
 * @returns The size of the file that was uploaded in bytes along with any failed uploads
 */
async function uploadFileAsync(
  parameters: UploadFileParameters
): Promise<UploadFileResult> {
  const fileSize: number = fs.statSync(parameters.file).size
  const parallelUploads = [...new Array(parameters.concurrency).keys()]
  let offset = 0
  let isUploadSuccessful = true
  let failedChunkSizes = 0
  let abortFileUpload = false

  await Promise.all(
    parallelUploads.map(async () => {
      while (offset < fileSize) {
        const chunkSize = Math.min(fileSize - offset, parameters.maxChunkSize)
        if (abortFileUpload) {
          // if we don't want to continue on error, any pending upload chunk will be marked as failed
          failedChunkSizes += chunkSize
          continue
        }

        const start = offset
        const end = offset + chunkSize - 1
        offset += parameters.maxChunkSize
        const chunk: NodeJS.ReadableStream = fs.createReadStream(
          parameters.file,
          {
            start,
            end,
            autoClose: false
          }
        )

        const result = await uploadChunk(
          parameters.restClient,
          parameters.resourceUrl,
          chunk,
          start,
          end,
          fileSize
        )
        if (!result) {
          /**
           * Chunk failed to upload, report as failed but continue if desired. It is possible that part of a chunk was
           * successfully uploaded so the server may report a different size for what was uploaded
           **/

          isUploadSuccessful = false
          failedChunkSizes += chunkSize
          if (!parameters.continueOnError) {
            // Any currently uploading chunks will be able to finish, however pending chunks will not upload
            // eslint-disable-next-line no-console
            console.log(`Aborting upload for ${parameters.file} due to failure`)
            abortFileUpload = true
          }
        }
      }
    })
  )
  return {
    isSuccess: isUploadSuccessful,
    successfulUploadSize: fileSize - failedChunkSizes
  }
}

/**
 * Uploads a chunk of an individual file to the specified resourceUrl. If the upload fails and the status code
 * indicates a retryable status, we try to upload the chunk as well
 * @param {HttpClient} restClient RestClient that will be making the appropriate HTTP call
 * @param {string} resourceUrl Url of the resource that the chunk will be uploaded to
 * @param {NodeJS.ReadableStream} data Stream of the file that will be uploaded
 * @param {number} start Starting byte index of file that the chunk belongs to
 * @param {number} end Ending byte index of file that the chunk belongs to
 * @param {number} totalSize Total size of the file in bytes that is being uploaded
 * @returns if the chunk was successfully uploaded
 */
async function uploadChunk(
  restClient: HttpClient,
  resourceUrl: string,
  data: NodeJS.ReadableStream,
  start: number,
  end: number,
  totalSize: number
): Promise<boolean> {
  // eslint-disable-next-line no-console
  console.log(
    `Uploading chunk of size ${end -
      start +
      1} bytes at offset ${start} with content range: ${getContentRange(
      start,
      end,
      totalSize
    )}`
  )

  const requestOptions = getRequestOptions(
    'application/octet-stream',
    totalSize,
    getContentRange(start, end, totalSize)
  )

  const uploadChunkRequest = async (): Promise<IHttpClientResponse> => {
    return await restClient.sendStream('PUT', resourceUrl, data, requestOptions)
  }

  const response = await uploadChunkRequest()
  if (
    response.message.statusCode &&
    isSuccessStatusCode(response.message.statusCode)
  ) {
    debug(
      `Chunk for ${start}:${end} was successfully uploaded to ${resourceUrl}`
    )
    return true
  } else if (
    response.message.statusCode &&
    isRetryableStatusCode(response.message.statusCode)
  ) {
    // eslint-disable-next-line no-console
    console.log(
      `Received http ${response.message.statusCode} during chunk upload, will retry at offset ${start} after 10 seconds.`
    )
    await new Promise(resolve => setTimeout(resolve, 10000))
    const retryResponse = await uploadChunkRequest()
    if (
      retryResponse.message.statusCode &&
      isSuccessStatusCode(retryResponse.message.statusCode)
    ) {
      return true
    } else {
      // eslint-disable-next-line no-console
      console.log(`Unable to upload chunk even after retrying`)
      return false
    }
  }

  // Upload must have failed spectacularly somehow, log full result for diagnostic purposes
  // eslint-disable-next-line no-console
  console.log(response)
  return false
}

/**
 * Updates the size of the artifact from -1 which was initially set when the container was first created for the artifact.
 * Updating the size indicates that we are done uploading all the contents of the artifact. A server side check will be run
 * to check that the artifact size is correct for billing purposes
 */
export async function patchArtifactSize(
  size: number,
  artifactName: string
): Promise<void> {
  const client = createHttpClient(getRuntimeToken())
  const requestOptions = getRequestOptions('application/json')
  const resourceUrl = new URL(
    getArtifactUrl(getRuntimeUrl(), getWorkFlowRunId())
  )
  resourceUrl.searchParams.append('artifactName', artifactName)

  const parameters: PatchArtifactSize = {Size: size}
  const data: string = JSON.stringify(parameters, null, 2)
  debug(`URL is ${resourceUrl.toString()}`)

  const rawResponse: HttpClientResponse = await client.patch(
    resourceUrl.toString(),
    data,
    requestOptions
  )
  const body: string = await rawResponse.readBody()

  if (rawResponse.message.statusCode === 200) {
    const successResponse: PatchArtifactSizeSuccessResponse = JSON.parse(body)
    // eslint-disable-next-line no-console
    console.log(
      `Artifact ${artifactName} uploaded successfully, total size ${size}`
    )
    // eslint-disable-next-line no-console
    console.log(successResponse)
  } else if (rawResponse.message.statusCode === 404) {
    throw new Error(`An Artifact with the name ${artifactName} was not found`)
  } else {
    // eslint-disable-next-line no-console
    console.log(body)
    throw new Error(`Unable to finish uploading artifact ${artifactName}`)
  }
}

interface UploadFileParameters {
  file: string
  resourceUrl: string
  restClient: HttpClient
  concurrency: number
  maxChunkSize: number
  continueOnError: boolean
}

interface UploadFileResult {
  isSuccess: boolean
  successfulUploadSize: number
}
