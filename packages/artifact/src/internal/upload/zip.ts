import * as stream from 'stream'
import * as ZipStream from 'zip-stream'
import * as core from '@actions/core'
import async from 'async'
import {createReadStream} from 'fs'
import {UploadZipSpecification} from './upload-zip-specification'
import {getUploadChunkSize} from '../shared/config'

export const DEFAULT_COMPRESSION_LEVEL = 6

// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
export class ZipUploadStream extends stream.Transform {
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

export async function createZipUploadStream(
  uploadSpecification: UploadZipSpecification[],
  compressionLevel: number = DEFAULT_COMPRESSION_LEVEL
): Promise<ZipUploadStream> {
  core.debug(
    `Creating Artifact archive with compressionLevel: ${compressionLevel}`
  )
  const zlibOptions = {
    zlib: {
      level: compressionLevel,
      bufferSize: getUploadChunkSize()
    }
  }
  const zip = new ZipStream.default(zlibOptions)
  // register callbacks for various events during the zip lifecycle
  zip.on('error', zipErrorCallback)
  zip.on('warning', zipWarningCallback)
  zip.on('finish', zipFinishCallback)
  zip.on('end', zipEndCallback)
  // see https://caolan.github.io/async/v3/docs.html#queue for options
  const fileUploadQueue = async.queue(function (fileItem, callback) {
    try {
      core.debug(`adding ${fileItem} to the file queue`)
      callback()
    } catch (err) {
      core.error(`task experienced an error: ${fileItem} ${err}`)
      callback(err)
    }
  }) // concurrency for uploads automatically set to 1

  fileUploadQueue.error(function (err, task) {
    core.error(`task experienced an error: ${task} ${err}`)
  })

  for (const file of uploadSpecification) {
    if (file.sourcePath !== null) {
      const readStream = createReadStream(file.sourcePath)
      readStream.on('end', () => {
        core.debug('The upload read stream is ending')
      })
      readStream.on('error', function (err) {
        core.debug(`${err}`)
      }) // Catch any errors from createReadStream
      const fileEntry = zip.entry(
        readStream,
        {name: file.destinationPath},
        function (err, entry) {
          if (err) {
            core.error('A file entry error occurred:', err)
          }
          core.debug(`File entry was succesfull: ${entry}`)
        }
      )

      fileUploadQueue.push(fileEntry)
    } else {
      fileUploadQueue.push(
        zip.entry(
          null,
          {name: `${file.destinationPath}/`},
          function (err, entry) {
            if (err) {
              core.error('A directory entry error occurred:', err)
            }
            core.debug(`File entry was succesfull: ${entry}`)
          }
        )
      )
    }
  }

  core.debug(`Starting the finalizing of all entries`)

  fileUploadQueue.drain(() => {
    core.debug('all items have been processed')
  })
  zip.finalize()
  core.debug(`Finalizing entries`)
  const bufferSize = getUploadChunkSize()
  const zipUploadStream = new ZipUploadStream(bufferSize)
  zip.pipe(zipUploadStream) // Pipe the zip stream into zipUploadStream

  core.debug(
    `Zip write high watermark value ${zipUploadStream.writableHighWaterMark}`
  )
  core.debug(
    `Zip read high watermark value ${zipUploadStream.readableHighWaterMark}`
  )
  return zipUploadStream
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipErrorCallback = (error: any): void => {
  core.error('An error has occurred while creating the zip file for upload')
  core.info(error)

  throw new Error('An error has occurred during zip creation for the artifact')
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipWarningCallback = (error: any): void => {
  if (error.code === 'ENOENT') {
    core.warning(
      'ENOENT warning during artifact zip creation. No such file or directory'
    )
    core.info(error)
  } else {
    core.warning(
      `A non-blocking warning has occurred during artifact zip creation: ${error.code}`
    )
    core.info(error)
  }
}

const zipFinishCallback = (): void => {
  core.debug('Zip stream for upload has finished.')
}

const zipEndCallback = (): void => {
  core.debug('Zip stream for upload has ended.')
}
