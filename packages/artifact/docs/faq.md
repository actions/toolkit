# Frequently Asked Questions

- [Frequently Asked Questions](#frequently-asked-questions)
  - [Supported Characters](#supported-characters)
  - [Compression? ZIP? How is my artifact stored?](#compression-zip-how-is-my-artifact-stored)

## Supported Characters

When uploading an artifact, the inputted `name` parameter along with the files specified in `files` cannot contain any of the following characters. If they are present in `name` or `files`,  the Artifact will be rejected by the server and the upload will fail. These characters are not allowed due to limitations and restrictions with certain file systems such as NTFS. To maintain platform-agnostic behavior, characters that are not supported by an individual filesystem/platform will not be supported on all filesystems/platforms.

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

## Compression? ZIP? How is my artifact stored?

When creating an Artifact, the files are dynamically compressed and streamed into a ZIP archive. Since they are stored in a ZIP, they can be compressed by Zlib in varying levels.

The value can range from 0 to 9:

- 0: No compression
- 1: Best speed
- 6: Default compression (same as GNU Gzip)
- 9: Best compression

Higher levels will result in better compression, but will take longer to complete.
For large files that are not easily compressed, a value of 0 is recommended for significantly faster uploads.
