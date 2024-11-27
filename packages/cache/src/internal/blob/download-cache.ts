import * as core from '@actions/core'

import {
  BlobClient,
  BlockBlobClient,
  BlobDownloadOptions,
  BlobDownloadResponseParsed
} from '@azure/storage-blob'

export async function downloadCacheFile(
  signedUploadURL: string,
  archivePath: string
): Promise<BlobDownloadResponseParsed> {
  const downloadOptions: BlobDownloadOptions = {
    maxRetryRequests: 5
  }

  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.debug(
    `BlobClient: ${blobClient.name}:${blobClient.accountName}:${blobClient.containerName}`
  )

  const response = await blockBlobClient.downloadToFile(
    archivePath,
    0,
    undefined,
    downloadOptions
  )

  switch (response._response.status) {
    case 200:
      core.info(`Cache downloaded from "${signedUploadURL}"`)
      break
    case 304:
      core.info(`Cache not found at "${signedUploadURL}"`)
      break
    default:
      core.info(`Unexpected HTTP response: ${response._response.status}`)
      break
  }

  return response
}
