# Additional Information

Extra information 
- [Non-Supported Characters](#Non-Supported-Characters)
- [Permission loss](#Permission-Loss)
- [Considerations](#Considerations)
- [Compression](#Is-my-artifact-compressed)

## Non-Supported Characters

When uploading an artifact, the inputted `name` parameter along with the files specified in `files` cannot contain any of the following characters. They will be rejected by the server if attempted to be sent over and the upload will fail. These characters are not allowed due to limitations and restrictions with certain file systems such as NTFS. To maintain platform-agnostic behavior, all characters that are not supported by an individual filesystem/platform will not be supported on all filesystems/platforms.

- "
- :
- <
- \>
- |
- \*
- ?

In addition to the aforementioned characters, the inputted `name` also cannot include the following
- \
- /


## Permission Loss

File permissions are not maintained between uploaded and downloaded artifacts. If file permissions are something that need to be maintained (such as an executable), consider archiving all of the files using something like `tar` and then uploading the single archive. After downloading the artifact, you can `un-tar` the individual file and permissions will be preserved.

```js
const artifact = require('@actions/artifact');
const artifactClient = artifact.create()
const artifactName = 'my-artifact';
const files = [
    '/home/user/files/plz-upload/my-archive.tgz',
]
const rootDirectory = '/home/user/files/plz-upload'
const uploadResult = await artifactClient.uploadArtifact(artifactName, files, rootDirectory)
```

## Considerations

During upload, each file is uploaded concurrently in 4MB chunks using a separate HTTPS connection per file. Chunked uploads are used so that in the event of a failure (which is entirely possible because the internet is not perfect), the upload can be retried. If there is an error, a retry will be attempted after a certain period of time.

Uploading will be generally be faster if there are fewer files that are larger in size vs if there are lots of smaller files. Depending on the types and quantities of files being uploaded, it might be beneficial to separately compress and archive everything into a single archive (using something like `tar` or `zip`) before starting and artifact upload to speed things up.

## Is my artifact compressed?

GZip is used internally to compress individual files before starting an upload. Compression helps reduce the total amount of data that must be uploaded and stored while helping to speed up uploads (this performance benefit is significant especially on self hosted runners). If GZip does not reduce the size of the file that is being uploaded, the original file is uploaded as-is.

Compression using GZip also helps speed up artifact download as part of a workflow. Header information is used to determine if an individual file was uploaded using GZip and if necessary, decompression is used. 

When downloading an artifact from the GitHub UI (this differs from downloading an artifact during a workflow), a single Zip file is dynamically created that contains all of the files uploaded as part of an artifact. Any files that were uploaded using GZip will be decompressed on the server before being added to the Zip file with the remaining files.
