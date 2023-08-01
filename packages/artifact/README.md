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
- `size`
    - Total size of the artifact that was uploaded in bytes

## Contributions

See [contributor guidelines](https://github.com/actions/toolkit/blob/main/.github/CONTRIBUTING.md) for general guidelines and information about toolkit contributions.

For contributions related to this package, see [artifact contributions](CONTRIBUTIONS.md) for more information.
