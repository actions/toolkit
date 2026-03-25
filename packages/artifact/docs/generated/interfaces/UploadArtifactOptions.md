[@actions/artifact](../README.md) / UploadArtifactOptions

# Interface: UploadArtifactOptions

Options for uploading an artifact

## Table of contents

### Properties

- [compressionLevel](UploadArtifactOptions.md#compressionlevel)
- [retentionDays](UploadArtifactOptions.md#retentiondays)

## Properties

### compressionLevel

• `Optional` **compressionLevel**: `number`

The level of compression for Zlib to be applied to the artifact archive.
The value can range from 0 to 9:
- 0: No compression
- 1: Best speed
- 6: Default compression (same as GNU Gzip)
- 9: Best compression
Higher levels will result in better compression, but will take longer to complete.
For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.

#### Defined in

[src/internal/shared/interfaces.ts:52](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/interfaces.ts#L52)

___

### retentionDays

• `Optional` **retentionDays**: `number`

Duration after which artifact will expire in days.

By default artifact expires after 90 days:
https://docs.github.com/en/actions/configuring-and-managing-workflows/persisting-workflow-data-using-artifacts#downloading-and-deleting-artifacts-after-a-workflow-run-is-complete

Use this option to override the default expiry.

Min value: 1
Max value: 90 unless changed by repository setting

If this is set to a greater value than the retention settings allowed, the retention on artifacts
will be reduced to match the max value allowed on server, and the upload process will continue. An
input of 0 assumes default retention setting.

#### Defined in

[src/internal/shared/interfaces.ts:41](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/interfaces.ts#L41)
