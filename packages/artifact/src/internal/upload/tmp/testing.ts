import {AppendBlobAppendBlockOptions, BlobClient} from '@azure/storage-blob'
import * as a from 'archiver'
import * as fs from 'fs'
import * as stream from 'stream'

// for local testing, run this using ts-node testing.ts
export async function test(){

    const sasURL = "http://127.0.0.1:11000/devstoreaccount1/actions-results/workflow-run-d...{add full SAS URL for testing here}"
    const blobClient = new BlobClient(sasURL);
    const zip = a.create('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // append files that are going to be part of the final zip
    zip.append('this is file 1', { name: 'file1.txt' });
    zip.append('this is file 2', { name: 'file2.txt' });
    zip.append('this is file 1 in a directory', { name: 'dir/file1.txt' });
    zip.append('this is file 2 in a directory', { name: 'dir/file2.txt' });
    zip.append(fs.createReadStream('a.txt'), { name: 'dir2/a.txt' })
    zip.append(fs.createReadStream('b.txt'), { name: 'dir2/b.txt' })

    // Create in-memory duplex stream to pipe zip straight to the upload
    const passThroughStream = new stream.PassThrough()
    zip.pipe(passThroughStream)
    zip.finalize();

    // Upload options
    const ONE_MEGABYTE = 1024 * 1024;
    const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 5 };
    const blockBlobClient = blobClient.getBlockBlobClient()
  
    // Upload!
    try {
        await blockBlobClient.uploadStream(
            passThroughStream,
            uploadOptions.bufferSize,
            uploadOptions.maxBuffers
        );
    } catch (error){
        console.log(error)
    }

    // That was easy
    console.log("this worked!")
}

test()


    // Another simple way of doing this
    //const appendBlobClient = blobClient.getAppendBlobClient()

    //const response = await appendBlobClient.createIfNotExists()
    //console.log(response)


    //const content = "hello there! This is uploading from a SAS"

    //const options : AppendBlobAppendBlockOptions = {
        // TODO, we could add MD5 or CRC64 hash info to protect the integrity
    //}

    //const response2 = await appendBlobClient.appendBlock(content, content.length, options);