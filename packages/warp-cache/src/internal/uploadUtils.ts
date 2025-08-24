import * as core from '@actions/core'
import * as utils from './cacheUtils'
import * as os from 'os'

import fs from 'fs'

import axios, {AxiosError} from 'axios'
import {InternalS3CompletedPart} from './contracts'

import {Storage, TransferManager} from '@google-cloud/storage'

function getContentRange(start: number, end: number): string {
  // Format: `bytes start-end/filesize
  // start and end are inclusive
  // filesize can be *
  // For a 200 byte chunk starting at byte 0:
  // Content-Range: bytes 0-199/*
  return `bytes ${start}-${end}/*`
}

async function uploadChunk(
  resourceUrl: string,
  openStream: () => NodeJS.ReadableStream,
  partNumber: number,
  start: number,
  end: number
): Promise<InternalS3CompletedPart> {
  core.debug(
    `Uploading chunk of size ${
      end - start + 1
    } bytes at offset ${start} with content range: ${getContentRange(
      start,
      end
    )}`
  )

  // Manually convert the readable stream to a buffer. S3 doesn't allow stream as input
  const chunks = await utils.streamToBuffer(openStream())

  try {
    // HACK: Using axios here as S3 API doesn't allow readable stream as input and Github's HTTP client is not able to send buffer as body
    const response = await axios.request({
      method: 'PUT',
      url: resourceUrl,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      data: chunks
    })
    return {
      ETag: response.headers.etag ?? '',
      PartNumber: partNumber
    }
  } catch (error) {
    throw new Error(
      `Cache service responded with ${(error as AxiosError).response
        ?.status} during upload chunk.`
    )
  }
}

export async function uploadFileToS3(
  preSignedURLs: string[],
  archivePath: string
): Promise<InternalS3CompletedPart[]> {
  const fileSize = utils.getArchiveFileSizeInBytes(archivePath)
  const numberOfChunks = preSignedURLs.length

  let concurrency = 4
  // Adjust concurrency based on the number of cpu cores
  if (os.cpus().length > 4) {
    concurrency = 8
  }

  const fd = fs.openSync(archivePath, 'r')

  core.debug(`Awaiting all uploads with concurrency limit of ${concurrency}`)
  let offset = 0

  const completedParts: InternalS3CompletedPart[] = []

  try {
    for (let i = 0; i < numberOfChunks; i += concurrency) {
      const batch = preSignedURLs
        .slice(i, i + concurrency)
        .map((presignedURL, index) => {
          const chunkIndex = i + index
          const chunkSize = Math.ceil(fileSize / numberOfChunks)
          const start = offset
          const end = offset + chunkSize - 1
          offset += chunkSize

          return uploadChunk(
            presignedURL,
            () =>
              fs
                .createReadStream(archivePath, {
                  fd,
                  start,
                  end,
                  autoClose: false
                })
                .on('error', error => {
                  throw new Error(
                    `Cache upload failed because file read failed with ${error.message}`
                  )
                }),
            chunkIndex + 1,
            start,
            end
          )
        })

      const batchResults = await Promise.all(batch)
      completedParts.push(...batchResults)
    }
    return completedParts
  } finally {
    fs.closeSync(fd)
  }
}

/*
 * Uploads the cache to GCS
 * @param localArchivePath - The path to the cache archive
 * @param bucketName - The name of the bucket in GCS
 * @param objectName - The name of the object in GCS
 */
export async function multiPartUploadToGCS(
  storage: Storage,
  localArchivePath: string,
  bucketName: string,
  objectName: string
) {
  try {
    const transferManager = new TransferManager(storage.bucket(bucketName))

    await transferManager.uploadFileInChunks(localArchivePath, {
      uploadName: objectName
    })
  } catch (error) {
    throw new Error(`Failed to upload to GCS: ${error}`)
  }
}
