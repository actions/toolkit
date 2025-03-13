# @actions/artifact Releases

### 2.3.1

- Fix comment typo on expectedHash. [#1986](https://github.com/actions/toolkit/pull/1986)

### 2.3.0

- Allow ArtifactClient to perform digest comparisons, if supplied. [#1975](https://github.com/actions/toolkit/pull/1975)

### 2.2.2

- Default concurrency to 5 for uploading artifacts [#1962](https://github.com/actions/toolkit/pull/1962

### 2.2.1

- Add `ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY` and `ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS` environment variables [#1928](https://github.com/actions/toolkit/pull/1928)

### 2.2.0

- Return artifact digest on upload [#1896](https://github.com/actions/toolkit/pull/1896)

### 2.1.11

- Fixed a bug with relative symlinks resolution [#1844](https://github.com/actions/toolkit/pull/1844)
- Use native `crypto` [#1815](https://github.com/actions/toolkit/pull/1815)

### 2.1.10

- Fixed a regression with symlinks not being automatically resolved [#1830](https://github.com/actions/toolkit/pull/1830)
- Fixed a regression with chunk timeout [#1786](https://github.com/actions/toolkit/pull/1786)

### 2.1.9

- Fixed artifact upload chunk timeout logic [#1774](https://github.com/actions/toolkit/pull/1774)
- Use lazy stream to prevent issues with open file limits [#1771](https://github.com/actions/toolkit/pull/1771)

### 2.1.8

- Allows `*.localhost` domains for hostname checks for local development.

### 2.1.7

- Update unzip-stream dependency and reverted to using `unzip.Extract()`

### 2.1.6

- Will retry on invalid request responses.

### 2.1.5

- Bumped `archiver` dependency to 7.0.1

### 2.1.4

- Adds info-level logging for zip extraction

### 2.1.3

- Fixes a bug in the extract logic updated in 2.1.2

### 2.1.2

- Updated the stream extract functionality to use `unzip.Parse()` instead of `unzip.Extract()` for greater control of unzipping artifacts

### 2.1.1

- Updated `isGhes` check to include `.ghe.com` and `.ghe.localhost` as accepted hosts

### 2.1.0

- Added `ArtifactClient#deleteArtifact` to delete artifacts by name [#1626](https://github.com/actions/toolkit/pull/1626)
- Update error messaging to be more useful [#1628](https://github.com/actions/toolkit/pull/1628)

### 2.0.1

- Patch to fix transient request timeouts https://github.com/actions/download-artifact/issues/249

### 2.0.0

- Major release. Supports new Artifact backend for improved speed, reliability and behavior.
- Numerous API changes, [some breaking](./README.md#breaking-changes).

- [Blog post with more info](https://github.blog/2024-02-12-get-started-with-v4-of-github-actions-artifacts/)

### 1.1.1

- Fixed a bug in Node16 where if an HTTP download finished too quickly (<1ms, e.g. when it's mocked) we attempt to delete a temp file that has not been created yet [#1278](https://github.com/actions/toolkit/pull/1278/commits/b9de68a590daf37c6747e38d3cb4f1dd2cfb791c)

### 1.1.0

- Add `x-actions-results-crc64` and `x-actions-results-md5` checksum headers on upload [#1063](https://github.com/actions/toolkit/pull/1063)

### 1.0.2

- Update to v2.0.1 of `@actions/http-client` [#1087](https://github.com/actions/toolkit/pull/1087)

### 1.0.1

- Update to v2.0.0 of `@actions/http-client`

### 1.0.0

- Update `lockfileVersion` to `v2` in `package-lock.json` [#1009](https://github.com/actions/toolkit/pull/1009)

### 0.6.1

- Fix for failing 0 byte file uploads on Windows [#962](https://github.com/actions/toolkit/pull/962)

### 0.6.0

- Support upload from named pipes [#748](https://github.com/actions/toolkit/pull/748)
- Fixes to percentage values being greater than 100% when downloading all artifacts [#889](https://github.com/actions/toolkit/pull/889)
- Improved logging and output during artifact upload [#949](https://github.com/actions/toolkit/pull/949)
- Improvements to client-side validation for certain invalid characters not allowed during upload: [#951](https://github.com/actions/toolkit/pull/951)
- Faster upload speeds for certain types of large files by exempting gzip compression [#956](https://github.com/actions/toolkit/pull/956)
- More detailed logging when dealing with chunked uploads [#957](https://github.com/actions/toolkit/pull/957)
  
### 0.5.2

- Add HTTP 500 as a retryable status code for artifact upload and download.
  
### 0.5.1

- Bump @actions/http-client to version 1.0.11 to fix proxy related issues during artifact upload and download

### 0.5.0

- Improved retry-ability for all http calls during artifact upload and download if an error is encountered

### 0.4.2

- Improved retry-ability when a partial artifact download is encountered

### 0.4.1

- Update to latest @actions/core version

### 0.4.0

- Add option to specify custom retentions on artifacts
- 
### 0.3.5

- Retry in the event of a 413 response

### 0.3.3

- Increase chunk size during upload from 4MB to 8MB
- Improve user-agent strings during API calls to help internally diagnose issues

### 0.3.2

- Fix to ensure readstreams get correctly reset in the event of a retry

### 0.3.1

- Fix to ensure temporary gzip files get correctly deleted during artifact upload
- Remove spaces as a forbidden character during upload

### 0.3.0

- Fixes to gzip decompression when downloading artifacts
- Support handling 429 response codes
- Improved download experience when dealing with empty files
- Exponential backoff when retryable status codes are encountered
- Clearer error message if storage quota has been reached
- Improved logging and output during artifact download

### 0.2.0

- Fixes to TCP connections not closing
- GZip file compression to speed up downloads
- Improved logging and output
- Extra documentation

### 0.1.0

- Initial release
