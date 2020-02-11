# `@actions/artifact`

## Usage

You can use this package to interact with the actions artifact service to upload and download artifacts.
- [Upload an Artifact](##Upload-an-Artifact)
- [Download a Single Artifact](##Download-a-Single-Artifact)
- [Download All Artifacts](##Download-all-Artifacts)

Relative paths and absolute paths are both allowed. Relative paths are rooted against the current working directory.

## Upload an Artifact

#### Inputs
 - `Name`
    - The name of the artifact that is being uploaded
    - Required
 - `files`
    - A list of file paths that describe what should be uploaded as part of the artifact
    - If a path is provided that does not exist, an error will be thrown
    - Can be absolute or relative. Internally everything is normalized and resolved
    - Required
 - `rootDirectory`
    - A file path that denotes the root directory of the files being uploaded. This path is used to strip the paths provided in `files` to control how they are uploaded and structured
    - If a file specified in `files` is not in the `rootDirectory`, an error will be thrown
    - Required
 - `options`
    - Extra options that allow for the customization of the upload behavior
    - Optional

#### Available Options

 - `continueOnError`
    - Indicates if the artifact upload should continue in the event a file or chunk fails to upload. If there is a error during upload, a partial artifact will always be created and available for download at the end. The `size` reported will be the amount of storage that the user or org will be charged for the partial artifact.
    - If set to `false`, and an error is encountered, all other uploads will stop and any files or chunks that were queued will not be attempted to be uploaded. The partial artifact available will only include files and chunks up until the failure
    - If set to `true` and an error is encountered, the failed file will be skipped and ignored and all other queued files will be attempted to be uploaded. There will be a an artifact available for download at the end with everything excluding the file/chunks that failed to upload
    - Optional, defaults to `true` if not specified

#### Example using Absolute File Paths

```js
const artifact = require('@actions/artifact');
const artifactClient = artifact.create()
const artifactName = 'my-artifact';
const files = [
    '/home/user/files/plz-upload/file1.txt',
    '/home/user/files/plz-upload/file2.txt',
    '/home/user/files/plz-upload/dir/file3.txt'
]
const rootDirectory = '/home/user/files/plz-upload'
const options = {
    continueOnError: true
}

const uploadResult = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options)
```

#### Example using Relative File Paths
```js
// Assuming the current working directory is /home/user/files/plz-upload
const artifact = require('@actions/artifact');
const artifactClient = artifact.create()
const artifactName = 'my-artifact';
const files = [
    'file1.txt',
    'file2.txt',
    'dir/file3.txt'
]

const rootDirectory = '.' // Also possible to specify __dirname if using node
const options = {
    continueOnError: false
}

const uploadResponse = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options)
```

#### Upload Result

The returned `UploadResponse` will contain the following information

- `artifactName`
    - The name of the artifact that was uploaded
- `artifactItems`
    - A list of all files that describe what is uploaded if there are no errors encountered. Usually this will be equal to the inputted `files` with the exception of empty directories (will not be uploaded)
- `size`
    - Total size of the artifact that was uploaded in bytes
- `failedItems`
    - A list of items that were not uploaded successfully (this will include queued items that were not uploaded if `continueOnError` is set to false). This is a subset of `artifactItems`

#### Non-Supported Characters

The inputted `name` and files specified in `files` cannot contain any of the following characters. They will be rejected by the server if attempted to be sent over and the upload will fail. These characters are not allowed due to limitations and restrictions with certain file systems such as NTFS. To maintain platform-agnostic behavior, all characters that are not supported by an individual filesystem/platform will not be supported on all filesystems/platforms.

- "
- :
- <
- \>
- |
- \*
- ?
- empty space

In addition to the aforementioned characters, the inputted `name` also cannot include the following
- \
- /


#### Permission loss

Artifacts are uploaded and stored in blob storage rather than a full fledged file system. Because of this, file permissions are not always maintained between uploaded and downloaded artifacts. If file permissions are something that need to be maintained (such as an executable), consider archiving all of the files using something like `tar` and then uploading the single archive. After downloading the artifact, you can `un-tar` the individual file and permissions will be preserved.

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

#### Considerations related to the number of files being uploaded

During upload, each file is uploaded concurrently in 4MB chunks using a separate HTTPS connection per file. Chunked uploads are used so that in the event of a failure (which is entirely possible because the internet is not perfect), the upload can be retried. If there is an error, a retry will be attempted after waiting for 10 seconds.

Uploading will be generally be faster if there are fewer files that are larger in size vs if there are lots of smaller files. Depending on the types and quantities of files being uploaded, it might be beneficial to separately compress and archive everything into a single archive (using something like `tar` or `zip`) before starting and artifact upload to speed things up.

## Download a Single Artifact

#### Inputs
 - `Name`
    - The name of the artifact that is being downloaded
    - Required
 - `path`
    - Path that denotes where the artifact will be downloaded to
    - Optional. Defaults to the GitHub workspace directory(`$GITHUB_WORKSPACE`) if not specified
 - `options`
    - Extra options that allow for the customization of the download behavior
    - Optional


#### Available Options

 - `createArtifactFolder`
    - Specifies if a folder (the artifact name) is created for the artifact that is downloaded (contents downloaded into this folder),
    - Optional. Defaults to false if not specified

#### Example

```js
const artifact = require('@actions/artifact');
const artifactClient = artifact.create()
const artifactName = 'my-artifact';
const path = 'some/directory'
const options = {
    createArtifactFolder: false
}

const downloadResponse = await artifactClient.downloadArtifact(artifactName, path, options)
// Post download, the directory structure will look like this
/some
    /directory
        /file1.txt
        /file2.txt
        /dir
            /file3.txt

// If createArtifactFolder is set to true, the directory structure will look like this
/some
    /directory
        /my-artifact
            /file1.txt
            /file2.txt
            /dir
                /file3.txt
```

#### Download Response

The returned `DownloadResponse` will contain the following information

  - `artifactName`
    - The name of the artifact that was downloaded
  - `downloadPath`
    - The full Path to where the artifact was downloaded


## Download All Artifacts

#### Inputs
 - `path`
    - Path that denotes where the artifact will be downloaded to
    - Optional. Defaults to the GitHub workspace directory(`$GITHUB_WORKSPACE`) if not specified

```js
const artifact = require('@actions/artifact');
const artifactClient = artifact.create();
const downloadResponse = await artifactClient.downloadAllArtifacts();

// output result
for (response in downloadResponse) {
    console.log(response.artifactName);
    console.log(response.downloadPath);
}
```

Because there are multiple artifacts, an extra directory (denoted by the name of the artifact) will be created for each artifact in the path. With 2 artifacts for example (`my-artifact-1` and `my-artifact-2`) and the default path, the directory structure will be as follows:
```js
/GITHUB_WORKSPACE
    /my-artifact-1
        / .. contents of `my-artifact-1`
    /my-artifact-2
        / .. contents of `my-artifact-2`
```

```

#### Download Result

An array will be returned that describes the results for downloading all artifacts. The number of items in the array indicates the number of artifacts that were downloaded.

Each artifact will have the same `DownloadResponse` as if it was individually downloaded
  - `artifactName`
    - The name of the artifact that was downloaded
  - `downloadPath`
    - The full Path to where the artifact was downloaded