import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {IHttpClientResponse} from '@actions/http-client/interfaces'
import {BlockBlobClient} from '@azure/storage-blob'
import * as buffer from 'buffer'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'

import * as utils from './cacheUtils'
import {SocketTimeout} from './constants'
import {DownloadOptions} from '../options'
import {retryHttpClientResponse} from './requestUtils'

/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
async function pipeResponseToStream(
  response: IHttpClientResponse,
  output: NodeJS.WritableStream
): Promise<void> {
  const pipeline = util.promisify(stream.pipeline)
  await pipeline(response.message, output)
}

/**
 * Download the cache using the Actions toolkit http-client
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 */
export async function downloadCacheHttpClient(
  archiveLocation: string,
  archivePath: string
): Promise<void> {
  const writeStream = fs.createWriteStream(archivePath)
  const httpClient = new HttpClient('actions/cache')
  const downloadResponse = await retryHttpClientResponse(
    'downloadCache',
    async () => httpClient.get(archiveLocation)
  )

  // Abort download if no traffic received over the socket.
  downloadResponse.message.socket.setTimeout(SocketTimeout, () => {
    downloadResponse.message.destroy()
    core.debug(`Aborting download, socket timed out after ${SocketTimeout} ms`)
  })

  await pipeResponseToStream(downloadResponse, writeStream)

  // Validate download size.
  const contentLengthHeader = downloadResponse.message.headers['content-length']

  if (contentLengthHeader) {
    const expectedLength = parseInt(contentLengthHeader)
    const actualLength = utils.getArchiveFileSizeIsBytes(archivePath)

    if (actualLength !== expectedLength) {
      throw new Error(
        `Incomplete download. Expected file size: ${expectedLength}, actual file size: ${actualLength}`
      )
    }
  } else {
    core.debug('Unable to validate download, no Content-Length header')
  }
}

/**
 * Download the cache using the Azure Storage SDK.  Only call this method if the
 * URL points to an Azure Storage endpoint.
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 * @param options the download options
 */
export async function downloadCacheStorageSDK(
  archiveLocation: string,
  archivePath: string,
  options?: DownloadOptions
): Promise<void> {
  const client = new BlockBlobClient(archiveLocation, undefined, {
    retryOptions: {
      // Override the timeout used when downloading each 4 MB chunk
      // The default is 2 min / MB, which is way too slow
      tryTimeoutInMs: options?.timeoutInMs ?? 30000
    }
  })

  const properties = await client.getProperties()
  const contentLength = properties.contentLength ?? -1

  if (contentLength < 0) {
    // We should never hit this condition, but just in case fall back to downloading the
    // file as one large stream
    core.debug(
      'Unable to determine content length, downloading file with http-client...'
    )

    await downloadCacheHttpClient(archiveLocation, archivePath)
  } else {
    // Use downloadToBuffer for faster downloads, since internally it splits the
    // file into 4 MB chunks which can then be parallelized and retried independently
    //
    // If the file exceeds the buffer maximum length (~1 GB on 32-bit systems and ~2 GB
    // on 64-bit systems), split the download into multiple segments
    const maxSegmentSize = buffer.constants.MAX_LENGTH
    let offset = 0

    const fd = fs.openSync(archivePath, 'w')

    try {
      while (offset < contentLength) {
        const segmentSize = Math.min(maxSegmentSize, contentLength - offset)
        core.debug(
          `Downloading segment at offset ${offset} with length ${segmentSize}...`
        )

        const result = await client.downloadToBuffer(offset, segmentSize, {
          concurrency: options?.downloadConcurrency ?? 8
        })

        fs.writeFileSync(fd, result)

        core.debug(`Finished segment at offset ${offset}`)
        offset += segmentSize
      }
    } finally {
      fs.closeSync(fd)
    }
  }
}
