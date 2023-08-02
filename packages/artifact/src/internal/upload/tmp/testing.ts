import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import { TransferProgressEvent } from '@azure/core-http';
import * as a from 'archiver'
import * as fs from 'fs'
import * as stream from 'stream'

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


// for local testing, run this using ts-node testing.ts
export async function test(){
    let sasURL = "paste here"
    sasURL = sasURL.replace("http://devstoreaccount1.blob.codedev.localhost", "http://127.0.0.1:11000/devstoreaccount1")

    const blobClient = new BlobClient(sasURL);
    const zip = a.create('zip', {
        zlib: { level: 9 } // Sets the compression level.
        // Available options are 0-9
        // 0 => no compression
        // 1 => fastest with low compression
        // 9 => highest compression ratio but the slowest
    });

    // append files that are going to be part of the final zip
    zip.append('this is file 1', { name: 'file1.txt' });
    zip.append('this is file 2', { name: 'file2.txt' });
    zip.append('this is file 1 in a directory', { name: 'dir/file1.txt' });
    zip.append('this is file 2 in a directory', { name: 'dir/file2.txt' });
    zip.append('this is a live demo!!!', { name: 'dir/alive.txt' });
    zip.append(fs.createReadStream('a.txt'), { name: 'dir2/a.txt' })
    zip.append(fs.createReadStream('b.txt'), { name: 'dir2/b.txt' })

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

    let uploadByteCount = 0
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
        const aa = await blockBlobClient.uploadStream(
            zipUploadStream,
            bufferSize,
            maxBuffers,
            options
        );
    } catch (error){
        console.log(error)
    }
    console.log("final upload size in bytes is " + uploadByteCount)
}

test()
