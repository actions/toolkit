[@actions/artifact](../README.md) / DefaultArtifactClient

# Class: DefaultArtifactClient

The default artifact client that is used by the artifact action(s).

## Implements

- [`ArtifactClient`](../interfaces/ArtifactClient.md)

## Table of contents

### Constructors

- [constructor](DefaultArtifactClient.md#constructor)

### Methods

- [deleteArtifact](DefaultArtifactClient.md#deleteartifact)
- [downloadArtifact](DefaultArtifactClient.md#downloadartifact)
- [getArtifact](DefaultArtifactClient.md#getartifact)
- [listArtifacts](DefaultArtifactClient.md#listartifacts)
- [uploadArtifact](DefaultArtifactClient.md#uploadartifact)

## Constructors

### constructor

• **new DefaultArtifactClient**(): [`DefaultArtifactClient`](DefaultArtifactClient.md)

#### Returns

[`DefaultArtifactClient`](DefaultArtifactClient.md)

## Methods

### deleteArtifact

▸ **deleteArtifact**(`artifactName`, `options?`): `Promise`\<[`DeleteArtifactResponse`](../interfaces/DeleteArtifactResponse.md)\>

Delete an Artifact

If `options.findBy` is specified, this will use the public Delete Artifact API https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#delete-an-artifact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `artifactName` | `string` | The name of the artifact to delete |
| `options?` | [`FindOptions`](../interfaces/FindOptions.md) | Extra options that allow for the customization of the delete behavior |

#### Returns

`Promise`\<[`DeleteArtifactResponse`](../interfaces/DeleteArtifactResponse.md)\>

single DeleteArtifactResponse object

#### Implementation of

[ArtifactClient](../interfaces/ArtifactClient.md).[deleteArtifact](../interfaces/ArtifactClient.md#deleteartifact)

#### Defined in

[src/internal/client.ts:248](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/client.ts#L248)

___

### downloadArtifact

▸ **downloadArtifact**(`artifactId`, `options?`): `Promise`\<[`DownloadArtifactResponse`](../interfaces/DownloadArtifactResponse.md)\>

Downloads an artifact and unzips the content.

If `options.findBy` is specified, this will use the public Download Artifact API https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#download-an-artifact

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `artifactId` | `number` | The id of the artifact to download |
| `options?` | [`DownloadArtifactOptions`](../interfaces/DownloadArtifactOptions.md) & [`FindOptions`](../interfaces/FindOptions.md) | Extra options that allow for the customization of the download behavior |

#### Returns

`Promise`\<[`DownloadArtifactResponse`](../interfaces/DownloadArtifactResponse.md)\>

single DownloadArtifactResponse object

#### Implementation of

[ArtifactClient](../interfaces/ArtifactClient.md).[downloadArtifact](../interfaces/ArtifactClient.md#downloadartifact)

#### Defined in

[src/internal/client.ts:138](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/client.ts#L138)

___

### getArtifact

▸ **getArtifact**(`artifactName`, `options?`): `Promise`\<[`GetArtifactResponse`](../interfaces/GetArtifactResponse.md)\>

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
| `options?` | [`FindOptions`](../interfaces/FindOptions.md) | Extra options that allow for the customization of the get behavior |

#### Returns

`Promise`\<[`GetArtifactResponse`](../interfaces/GetArtifactResponse.md)\>

#### Implementation of

[ArtifactClient](../interfaces/ArtifactClient.md).[getArtifact](../interfaces/ArtifactClient.md#getartifact)

#### Defined in

[src/internal/client.ts:212](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/client.ts#L212)

___

### listArtifacts

▸ **listArtifacts**(`options?`): `Promise`\<[`ListArtifactsResponse`](../interfaces/ListArtifactsResponse.md)\>

Lists all artifacts that are part of the current workflow run.
This function will return at most 1000 artifacts per workflow run.

If `options.findBy` is specified, this will call the public List-Artifacts API which can list from other runs.
https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-workflow-run-artifacts

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | [`ListArtifactsOptions`](../interfaces/ListArtifactsOptions.md) & [`FindOptions`](../interfaces/FindOptions.md) | Extra options that allow for the customization of the list behavior |

#### Returns

`Promise`\<[`ListArtifactsResponse`](../interfaces/ListArtifactsResponse.md)\>

ListArtifactResponse object

#### Implementation of

[ArtifactClient](../interfaces/ArtifactClient.md).[listArtifacts](../interfaces/ArtifactClient.md#listartifacts)

#### Defined in

[src/internal/client.ts:176](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/client.ts#L176)

___

### uploadArtifact

▸ **uploadArtifact**(`name`, `files`, `rootDirectory`, `options?`): `Promise`\<[`UploadArtifactResponse`](../interfaces/UploadArtifactResponse.md)\>

Uploads an artifact.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the artifact, required |
| `files` | `string`[] | A list of absolute or relative paths that denote what files should be uploaded |
| `rootDirectory` | `string` | An absolute or relative file path that denotes the root parent directory of the files being uploaded |
| `options?` | [`UploadArtifactOptions`](../interfaces/UploadArtifactOptions.md) | Extra options for customizing the upload behavior |

#### Returns

`Promise`\<[`UploadArtifactResponse`](../interfaces/UploadArtifactResponse.md)\>

single UploadArtifactResponse object

#### Implementation of

[ArtifactClient](../interfaces/ArtifactClient.md).[uploadArtifact](../interfaces/ArtifactClient.md#uploadartifact)

#### Defined in

[src/internal/client.ts:113](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/client.ts#L113)
