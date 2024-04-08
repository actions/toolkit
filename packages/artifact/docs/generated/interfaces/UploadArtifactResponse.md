[@actions/artifact](../README.md) / UploadArtifactResponse

# Interface: UploadArtifactResponse

Response from the server when an artifact is uploaded

## Table of contents

### Properties

- [id](UploadArtifactResponse.md#id)
- [size](UploadArtifactResponse.md#size)

## Properties

### id

• `Optional` **id**: `number`

The id of the artifact that was created. Not provided if no artifact was uploaded
This ID can be used as input to other APIs to download, delete or get more information about an artifact: https://docs.github.com/en/rest/actions/artifacts

#### Defined in

[src/internal/shared/interfaces.ts:14](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/interfaces.ts#L14)

___

### size

• `Optional` **size**: `number`

Total size of the artifact in bytes. Not provided if no artifact was uploaded

#### Defined in

[src/internal/shared/interfaces.ts:8](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/interfaces.ts#L8)
