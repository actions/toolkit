import * as core from '@actions/core'
import {checkArtifactName} from './path-and-artifact-name-validation'
import {UploadOptions} from './upload-options'
import {UploadResponse} from './upload-response'
import { UploadSpecification, getUploadSpecification } from './upload-specification'
import { ArtifactHttpClient } from '../artifact-http-client'
import { ArtifactServiceClientJSON } from '../../generated/results/api/v1/artifact.twirp'

import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import { TransferProgressEvent } from '@azure/core-http';
import * as a from 'archiver'
import * as fs from 'fs'
import * as stream from 'stream'

import {getBackendIds, BackendIds} from '../util' 

const bufferSize = 1024 * 1024 * 8 // 8 MB

// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
export class ZipUploadStream extends stream.Transform {  
    constructor(bufferSize: number) {
        super({
            highWaterMark: bufferSize
        })
    }

    _transform(chunk:any, enc:any, cb:any) {
        cb(null, chunk)
    }
}

export async function uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions | undefined
  ): Promise<UploadResponse> {

    let uploadByteCount = 0

    // Need to keep checking the artifact name
    checkArtifactName(name)

    // Get specification for the files being uploaded
    const uploadSpecification: UploadSpecification[] = getUploadSpecification(
        name,
        rootDirectory,
        files
    )

    if (uploadSpecification.length === 0) {
        core.warning(`No files found that can be uploaded`)
    } else {
        const artifactClient = new ArtifactHttpClient('@actions/artifact-upload')
        const jsonClient = new ArtifactServiceClientJSON(artifactClient)

        const backendIDs: BackendIds = getBackendIds()

        console.log("workflow Run Backend ID " + backendIDs.workflowRunBackendId)
        console.log("workflow Job Run Backend ID " + backendIDs.workflowJobRunBackendId)

        console.log("hello Rob!!")

        try {




            const createResp = await jsonClient.CreateArtifact({workflowRunBackendId: backendIDs.workflowRunBackendId, workflowJobRunBackendId: backendIDs.workflowJobRunBackendId, name: name, version: 4})
    
            if (!createResp.ok) {
                core.error("CreateArtifact failed")
            }
    
            console.log(createResp.signedUploadUrl)
    
            // Blob upload start

            const blobClient = new BlobClient(createResp.signedUploadUrl);
            const zip = a.create('zip', {
                zlib: { level: 9 } // Sets the compression level.
                // Available options are 0-9
                // 0 => no compression
                // 1 => fastest with low compression
                // 9 => highest compression ratio but the slowest
            });

            console.log("file specification")
            for (const file of uploadSpecification) {
                console.log("uploadPath:" + file.uploadFilePath + " absolute:" + file.absoluteFilePath)
                zip.append(fs.createReadStream(file.absoluteFilePath), {name: file.uploadFilePath})
            }

            const zipUploadStream = new ZipUploadStream(bufferSize)
            zip.pipe(zipUploadStream)
            zip.finalize();

            console.log("Write high watermark value " + zipUploadStream.writableHighWaterMark)
            console.log("Read high watermark value "  + zipUploadStream.readableHighWaterMark)

            // good practice to catch warnings (ie stat failures and other non-blocking errors)
            zip.on('warning', function(err) {
                if (err.code === 'ENOENT') {
                    console.log("zip error ENOENT")
                } else {
                    console.log("some other warning ")
                    console.log(err)
                }
            });
        
            // good practice to catch this error explicitly
            zip.on('error', function(err) {
                console.log("some error with zip ")
                console.log(err)
            });

            zip.on("progress", function(progress: a.ProgressData) {
                console.log(progress)

                /* This outputs data like this, we could potentially do something with this for even more logging to show the status of the zip creation
                    {
                    entries: { total: 7, processed: 1 },
                    fs: { totalBytes: 0, processedBytes: 0 }
                    }
                    {
                    entries: { total: 7, processed: 2 },
                    fs: { totalBytes: 0, processedBytes: 0 }
                    }
                */
            })


            // We can add these to debug logging
            zip.on('end', function() {
                console.log("zip ending")
            });
            zip.on('finish', function() {
                console.log("zip finished")
            });

            // Upload options
            const maxBuffers = 5
            const blockBlobClient = blobClient.getBlockBlobClient()

            var myCallback = function(progress: TransferProgressEvent) {
                console.log("Byte upload count " + progress.loadedBytes)
                uploadByteCount = progress.loadedBytes
            };

            const options: BlockBlobUploadStreamOptions = {
                blobHTTPHeaders: { "blobContentType": "zip" },
                onProgress: myCallback
            }
        
            // Upload!
            try {
                await blockBlobClient.uploadStream(
                    zipUploadStream,
                    bufferSize,
                    maxBuffers,
                    options
                );
            } catch (error){
                console.log(error)
            }
            console.log("final upload size in bytes is " + uploadByteCount)

            console.log("we are done with the blob upload!")
            // Blob upload end

            const finalizeResp = await jsonClient.FinalizeArtifact({workflowRunBackendId: backendIDs.workflowRunBackendId, workflowJobRunBackendId: backendIDs.workflowJobRunBackendId, name: name, size: BigInt(5)})
    
            if (!finalizeResp.ok) {
                core.error("FinalizeArtifact failed")
            }
        } catch (e) {
            console.log(e)
        }
    
        console.log("FinalizeArtifact succeeded")
    }

    const uploadResponse: UploadResponse = {
      artifactName: name,
      size: uploadByteCount
    }

    return uploadResponse
}