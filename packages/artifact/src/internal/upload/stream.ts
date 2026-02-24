import * as stream from 'stream'
import * as fs from 'fs'
import {realpath} from 'fs/promises'
import * as core from '@actions/core'
import {getUploadChunkSize} from '../shared/config.js'

// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
export class WaterMarkedUploadStream extends stream.Transform {
  constructor(bufferSize: number) {
    super({
      highWaterMark: bufferSize
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transform(chunk: any, enc: any, cb: any): void {
    cb(null, chunk)
  }
}

export async function createRawFileUploadStream(
  filePath: string
): Promise<WaterMarkedUploadStream> {
  core.debug(`Creating raw file upload stream for: ${filePath}`)

  const bufferSize = getUploadChunkSize()
  const uploadStream = new WaterMarkedUploadStream(bufferSize)

  // Check if symlink and resolve the source path
  let sourcePath = filePath
  const stats = await fs.promises.lstat(filePath)
  if (stats.isSymbolicLink()) {
    sourcePath = await realpath(filePath)
  }

  // Create a read stream from the file and pipe it to the upload stream
  const fileStream = fs.createReadStream(sourcePath, {
    highWaterMark: bufferSize
  })

  fileStream.on('error', error => {
    core.error('An error has occurred while reading the file for upload')
    core.error(String(error))
    uploadStream.destroy(
      new Error('An error has occurred during file read for the artifact')
    )
  })

  fileStream.pipe(uploadStream)

  return uploadStream
}
