import {debug} from '@actions/core'
import {BearerCredentialHandler} from '@actions/http-client/auth'
import {HttpClientResponse, HttpClient} from '@actions/http-client/index'
import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {
  CreateArtifactResponse,
  CreateArtifactParameters,
  PatchArtifactSize,
  PatchArtifactSizeSuccessResponse
} from './contracts'
import * as fs from 'fs'
import {SearchResult} from './search'
import {URL} from 'url'
import {
  parseEnvNumber,
  getArtifactUrl,
  isSuccessStatusCode,
  isRetryableStatusCode,
  getRequestOptions,
  getContentRange
} from './utils'

const defaultChunkUploadConcurrency = 3
const defaultFileUploadConcurrency = 2

/**
 * Step 1 of 3 when uploading an artifact. Creates a file container for the new artifact in the remote blob storage/file service
 * @param {string} artifactName Name of the artifact being created
 * @returns The response from the Artifact Service if the file container was succesfully created
 */
export async function createArtifactInFileContainer(
  artifactName: string
): Promise<CreateArtifactResponse> {
  const token = process.env['ACTIONS_RUNTIME_TOKEN'] || ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)
  const requestOptions = getRequestOptions()
  requestOptions['Content-Type'] = 'application/json'

  const client: HttpClient = new HttpClient('actions/artifact', [
    bearerCredentialHandler
  ])
  const parameters: CreateArtifactParameters = {
    Type: 'actions_storage',
    Name: artifactName
  }
  const data: string = JSON.stringify(parameters, null, 2)
  const rawResponse: HttpClientResponse = await client.post(
    getArtifactUrl(),
    data,
    requestOptions
  )

  const body: string = await rawResponse.readBody()
  const response: CreateArtifactResponse = JSON.parse(body)
  // eslint-disable-next-line no-console
  console.log(response)

  if (rawResponse.message.statusCode === 201 && response) {
    return response
  } else {
    throw new Error(
      'Non 201 status code when creating file container for new artifact'
    )
  }
}

/**
 * Step 2 of 3 when uploading an artifact. Concurrently upload all of the files in chunks
 * @param {string} uploadUrl Base Url for the artifact that was created
 * @param {SearchResult[]} filesToUpload A list of information about the files being uploaded
 * @returns The size of all the files uploaded in bytes
 */
export async function uploadArtifactToFileContainer(
  uploadUrl: string,
  filesToUpload: SearchResult[]
): Promise<number> {
  const token = process.env['ACTIONS_RUNTIME_TOKEN'] || ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)
  const client: HttpClient = new HttpClient('actions/artifact', [
    bearerCredentialHandler
  ])

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
      maxChunkSize: MAX_CHUNK_SIZE
    })
  }

  const parallelUploads = [...new Array(FILE_CONCURRENCY).keys()]
  const fileSizes: number[] = []
  let uploadedFiles = 0

  // Only allow a certain amount of files to be uploaded at once, this is done to reduce errors if
  // trying to upload everything at once
  await Promise.all(
    parallelUploads.map(async () => {
      while (uploadedFiles < filesToUpload.length) {
        const currentFileParameters = parameters[uploadedFiles]
        uploadedFiles += 1
        fileSizes.push(await uploadFileAsync(currentFileParameters))
      }
    })
  )

  // Sum up all the files that were uploaded
  const sum = fileSizes.reduce((acc, val) => acc + val)
  // eslint-disable-next-line no-console
  console.log(`Total size of all the files uploaded ${sum}`)
  return sum
}

/**
 * Asyncronously uploads a file. If the file is bigger than the max chunk size it will be uploaded via multiple calls
 * @param {UploadFileParameters} parameters Information about the files that need to be uploaded
 * @returns The size of the file that was uploaded in bytes
 */
async function uploadFileAsync(
  parameters: UploadFileParameters
): Promise<number> {
  const fileSize: number = fs.statSync(parameters.file).size
  const parallelUploads = [...new Array(parameters.concurrency).keys()]
  let offset = 0

  await Promise.all(
    parallelUploads.map(async () => {
      while (offset < fileSize) {
        const chunkSize = Math.min(fileSize - offset, parameters.maxChunkSize)
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

        await uploadChunk(
          parameters.restClient,
          parameters.resourceUrl,
          chunk,
          start,
          end,
          fileSize
        )
      }
    })
  )
  return fileSize
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
 */
async function uploadChunk(
  restClient: HttpClient,
  resourceUrl: string,
  data: NodeJS.ReadableStream,
  start: number,
  end: number,
  totalSize: number
): Promise<void> {
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

  const requestOptions = getRequestOptions()
  requestOptions['Content-Type'] = 'application/octet-stream'
  requestOptions['Content-Length'] = totalSize
  requestOptions['Content-Range'] = getContentRange(start, end, totalSize)

  const uploadChunkRequest = async (): Promise<IHttpClientResponse> => {
    return await restClient.sendStream('PUT', resourceUrl, data, requestOptions)
  }

  const response = await uploadChunkRequest()

  if (!response.message.statusCode) {
    // eslint-disable-next-line no-console
    console.log(response)
    throw new Error('No Status Code returned with response')
  }

  if (isSuccessStatusCode(response.message.statusCode)) {
    debug(
      `Chunk for ${start}:${end} was succesfully uploaded to ${resourceUrl}`
    )
    return
  }
  if (isRetryableStatusCode(response.message.statusCode)) {
    // eslint-disable-next-line no-console
    console.log(
      `Received ${response.message.statusCode}, will retry chunk at offset ${start} after 10 seconds.`
    )
    await new Promise(resolve => setTimeout(resolve, 10000))
    // eslint-disable-next-line no-console
    console.log(`Retrying chunk at offset ${start}`)

    const retryResponse = await uploadChunkRequest()
    if (!retryResponse.message.statusCode) {
      // eslint-disable-next-line no-console
      console.log(retryResponse)
      throw new Error('No Status Code returne with response')
    }
    if (isSuccessStatusCode(retryResponse.message.statusCode)) {
      return
    }
  }
}

/**
 * Step 3 of 3 when uploading an artifact
 * Updates the size of the artifact from -1 which was initially set during step 1. Updating the size indicates that we are
 * done uploading all the contents of the artifact. A server side check will be run to check that the artifact size is correct
 * for billing purposes
 */
export async function patchArtifactSize(
  size: number,
  artifactName: string
): Promise<void> {
  const requestOptions = getRequestOptions()
  requestOptions['Content-Type'] = 'application/json'

  const resourceUrl = new URL(getArtifactUrl())
  resourceUrl.searchParams.append('artifactName', artifactName)

  const parameters: PatchArtifactSize = {Size: size}
  const data: string = JSON.stringify(parameters, null, 2)

  const token = process.env['ACTIONS_RUNTIME_TOKEN'] || ''
  const bearerCredentialHandler = new BearerCredentialHandler(token)
  const client: HttpClient = new HttpClient('actions/artifact', [
    bearerCredentialHandler
  ])
  // eslint-disable-next-line no-console
  console.log(`URL is ${resourceUrl.toString()}`)

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
}
