# `@actions/artifact`

## Usage

You can use this package to interact with the actions artifacts.
- [Upload an Artifact](#Upload-an-Artifact)
- [Download a Single Artifact](#Download-a-Single-Artifact)
- [Download All Artifacts](#Download-all-Artifacts)
- [Additional Documentation](#Additional-Documentation)
- [Contributions](#Contributions)

Relative paths and absolute paths are both allowed. Relative paths are rooted against the current working directory.

## Upload an Artifact

Method Name: `uploadArtifact`

#### Inputs
 - `name`
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
    - Indicates if the artifact upload should continue in the event a file fails to upload. If there is a error during upload, a partial artifact will always be created and available for download at the end. The `size` reported will be the amount of storage that the user or org will be charged for the partial artifact.
    - If set to `false`, and an error is encountered, all other uploads will stop and any files that were queued will not be attempted to be uploaded. The partial artifact available will only include files up until the failure.
    - If set to `true` and an error is encountered, the failed file will be skipped and ignored and all other queued files will be attempted to be uploaded. There will be an artifact available for download at the end with everything excluding the file that failed to upload
    - Optional, defaults to `true` if not specified
- `retentionDays`
    - Duration after which artifact will expire in days
    - Minimum value: 1
    - Maximum value: 90 unless changed by repository setting
    - If this is set to a greater value than the retention settings allowed, the retention on artifacts will be reduced to match the max value allowed on the server, and the upload process will continue. An input of 0 assumes default retention value.

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

const rootDirectory = '.' // Also possible to use __dirname
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

## Download a Single Artifact

Method Name: `downloadArtifact`

#### Inputs
 - `name`
    - The name of the artifact to download
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

Method Name: `downloadAllArtifacts`

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

Because there are multiple artifacts, an extra directory (denoted by the name of the artifact) will be created for each artifact in the path. With 2 artifacts(`my-artifact-1` and `my-artifact-2` for example) and the default path, the directory structure will be as follows:
```js
/GITHUB_WORKSPACE
    /my-artifact-1
        / .. contents of `my-artifact-1`
    /my-artifact-2
        / .. contents of `my-artifact-2`
```

#### Download Result

An array will be returned that describes the results for downloading all artifacts. The number of items in the array indicates the number of artifacts that were downloaded.

Each artifact will have the same `DownloadResponse` as if it was individually downloaded
  - `artifactName`
    - The name of the artifact that was downloaded
  - `downloadPath`
    - The full Path to where the artifact was downloaded

## Additional Documentation

Check out [additional-information](docs/additional-information.md) for extra documentation around usage, restrictions and behavior.

Check out [implementation-details](docs/implementation-details.md) for extra information about the implementation of this package.

## Contributions

See [contributor guidelines](https://github.com/actions/toolkit/blob/main/.github/CONTRIBUTING.md) for general guidelines and information about toolkit contributions.

For contributions related to this package, see [artifact contributions](CONTRIBUTIONS.md) for more information.
