[@actions/artifact](../README.md) / ArtifactClient

# Interface: ArtifactClient

Generic interface for the artifact client.

## Implemented by

- [`DefaultArtifactClient`](../classes/DefaultArtifactClient.md)

## Table of contents

### Methods

- [downloadArtifact](ArtifactClient.md#downloadartifact)
- [getArtifact](ArtifactClient.md#getartifact)
- [listArtifacts](ArtifactClient.md#listartifacts)
- [uploadArtifact](ArtifactClient.md#uploadartifact)

## Methods

### downloadArtifact

▸ **downloadArtifact**(`artifactId`, `options?`): `Promise`\<[`DownloadArtifactResponse`](DownloadArtifactResponse.md)\>

Downloads an artifact and unzips the content.

If `options.findBy` is specified, this will use the public Download Artifact API https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#download-an-artifact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `artifactId` | `number` | The name of the artifact to download |
| `options?` | [`DownloadArtifactOptions`](DownloadArtifactOptions.md) & [`FindOptions`](FindOptions.md) | Extra options that allow for the customization of the download behavior |

#### Returns

`Promise`\<[`DownloadArtifactResponse`](DownloadArtifactResponse.md)\>

single DownloadArtifactResponse object

#### Defined in

[src/internal/client.ts:84](https://github.com/actions/toolkit/blob/e3764a5/packages/artifact/src/internal/client.ts#L84)

___

### getArtifact

▸ **getArtifact**(`artifactName`, `options?`): `Promise`\<[`GetArtifactResponse`](GetArtifactResponse.md)\>

Finds an artifact by name.
If there are multiple artifacts with the same name in the same workflow run, this will return the latest.
If the artifact is not found, it will throw.

If `options.findBy` is specified, this will use the public List Artifacts API with a name filter which can get artifacts from other runs.
https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts
`@actions/artifact` v2+ does not allow for creating multiple artifacts with the same name in the same workflow run.
It is possible to have multiple artifacts with the same name in the same workflow run by using old versions of upload-artifact (v1,v2 and v3), @actions/artifact < v2 or it is a rerun.
If there are multiple artifacts with the same name in the same workflow run this function will return the first artifact that matches the name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `artifactName` | `string` | The name of the artifact to find |
| `options?` | [`FindOptions`](FindOptions.md) | Extra options that allow for the customization of the get behavior |

#### Returns

`Promise`\<[`GetArtifactResponse`](GetArtifactResponse.md)\>

#### Defined in

[src/internal/client.ts:70](https://github.com/actions/toolkit/blob/e3764a5/packages/artifact/src/internal/client.ts#L70)

___

### listArtifacts

▸ **listArtifacts**(`options?`): `Promise`\<[`ListArtifactsResponse`](ListArtifactsResponse.md)\>

Lists all artifacts that are part of the current workflow run.
This function will return at most 1000 artifacts per workflow run.

If `options.findBy` is specified, this will call the public List-Artifacts API which can list from other runs.
https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | [`ListArtifactsOptions`](ListArtifactsOptions.md) & [`FindOptions`](FindOptions.md) | Extra options that allow for the customization of the list behavior |

#### Returns

`Promise`\<[`ListArtifactsResponse`](ListArtifactsResponse.md)\>

ListArtifactResponse object

#### Defined in

[src/internal/client.ts:52](https://github.com/actions/toolkit/blob/e3764a5/packages/artifact/src/internal/client.ts#L52)

___

### uploadArtifact

▸ **uploadArtifact**(`name`, `files`, `rootDirectory`, `options?`): `Promise`\<[`UploadArtifactResponse`](UploadArtifactResponse.md)\>

Uploads an artifact.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the artifact, required |
| `files` | `string`[] | A list of absolute or relative paths that denote what files should be uploaded |
| `rootDirectory` | `string` | An absolute or relative file path that denotes the root parent directory of the files being uploaded |
| `options?` | [`UploadArtifactOptions`](UploadArtifactOptions.md) | Extra options for customizing the upload behavior |

#### Returns

`Promise`\<[`UploadArtifactResponse`](UploadArtifactResponse.md)\>

single UploadArtifactResponse object

#### Defined in

[src/internal/client.ts:35](https://github.com/actions/toolkit/blob/e3764a5/packages/artifact/src/internal/client.ts#L35)
