import * as fs from 'fs'
import {
  createHttpClient,
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
import {HttpClient} from '@actions/http-client'
import {DownloadItem} from './internal-download-specification'
import {getDownloadFileConcurrency} from './internal-config-variables'
import {warning} from '@actions/core'

/**
 * Gets a list of all artifacts that are in a specific container
 */
export async function listArtifacts(): Promise<ListArtifactsResponse> {
  const artifactUrl = getArtifactUrl()
  const client = createHttpClient()
  const requestOptions = getRequestOptions('application/json')

  const rawResponse = await client.get(artifactUrl, requestOptions)
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
    throw new Error(`Unable to list artifacts for the run`)
  }
}

/**
 * Fetches a set of container items that describe the contents of a single artifact
 * @param artifactName the name of the artifact
 * @param containerUrl the artifact container URL for the run
 */
export async function getContainerItemsForSingleArtifact(
  artifactName: string,
  containerUrl: string
): Promise<QueryArtifactResponse> {
  const resourceUrl = new URL(containerUrl)
  // The itemPath search parameter controls which containers will be returned. The artifact name acts as the root folder in the
  // container for all files associated with that particular artifact
  resourceUrl.searchParams.append('itemPath', artifactName)
  return queryForArtifactContainerItems(resourceUrl.toString())
}

/**
 * Fetches a set of container items that describe the contents of all available artifacts
 * @param containerUrl the artifact container ULR for the run
 */
export async function getContainerItemsForAllArtifacts(
  containerUrl: string
): Promise<QueryArtifactResponse> {
  // no itemPath search parameter is included so container items for all artifacts will be returned
  return queryForArtifactContainerItems(containerUrl)
}

export async function queryForArtifactContainerItems(
  resourceUrl: string
): Promise<QueryArtifactResponse> {
  const client = createHttpClient()
  const rawResponse = await client.get(resourceUrl)
  const body: string = await rawResponse.readBody()
  if (isSuccessStatusCode(rawResponse.message.statusCode) && body) {
    return JSON.parse(body)
  }
  throw new Error(`Unable to get ContainersItems from ${resourceUrl}`)
}

/**
 * Concurrently downloads all the files that are part of an artifact
 * @param downloadItems information about what items to download and where to save them
 */
export async function downloadSingleArtifact(
  downloadItems: DownloadItem[]
): Promise<void> {
  const DOWNLOAD_CONCURRENCY = getDownloadFileConcurrency()
  // Limit the number of files downloaded at a single time
  const parallelDownloads = [...new Array(DOWNLOAD_CONCURRENCY).keys()]
  const client = createHttpClient()
  let downloadedFiles = 0
  await Promise.all(
    parallelDownloads.map(async () => {
      while (downloadedFiles < downloadItems.length) {
        const currentFileToDownload = downloadItems[downloadedFiles]
        downloadedFiles += 1
        await downloadIndividualFile(
          client,
          currentFileToDownload.sourceLocation,
          currentFileToDownload.targetPath
        )
      }
    })
  )
}

/**
 * Downloads an individual file
 * @param client http client that will be used to make the necessary calls
 * @param artifactLocation origin location where a file will be downloaded from
 * @param downloadPath destination location for the file being downloaded
 */
export async function downloadIndividualFile(
  client: HttpClient,
  artifactLocation: string,
  downloadPath: string
): Promise<void> {
  const stream = fs.createWriteStream(downloadPath)
  const response = await client.get(artifactLocation)
  if (isSuccessStatusCode(response.message.statusCode)) {
    await pipeResponseToStream(response, stream)
  } else if (isRetryableStatusCode(response.message.statusCode)) {
    warning(
      `Received http ${response.message.statusCode} during file download, will retry ${artifactLocation} after 10 seconds`
    )
    await new Promise(resolve => setTimeout(resolve, 10000))
    const retryResponse = await client.get(artifactLocation)
    if (isSuccessStatusCode(retryResponse.message.statusCode)) {
      await pipeResponseToStream(response, stream)
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

export async function pipeResponseToStream(
  response: IHttpClientResponse,
  stream: NodeJS.WritableStream
): Promise<void> {
  return new Promise(resolve => {
    response.message.pipe(stream).on('close', () => {
      resolve()
    })
  })
}
