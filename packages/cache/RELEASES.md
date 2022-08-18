# @actions/cache Releases

### 0.1.0

- Initial release

### 0.2.0
- Fixes issues with the zstd compression algorithm on Windows and Ubuntu 16.04 [#469](https://github.com/actions/toolkit/pull/469)

### 0.2.1
- Fix to await async function getCompressionMethod

### 1.0.0
- Downloads Azure-hosted caches using the Azure SDK for speed and reliability
- Displays download progress
- Includes changes that break compatibility with earlier versions, including:
  - `retry`, `retryTypedResponse`, and `retryHttpClientResponse` moved from `cacheHttpClient` to `requestUtils`

### 1.0.1
- Fix bug in downloading large files (> 2 GBs) with the Azure SDK

### 1.0.2
- Use posix archive format to add support for some tools

### 1.0.3
- Use http-client v1.0.9
- Fixes error handling so retries are not attempted on non-retryable errors (409 Conflict, for example)
- Adds 5 second delay between retry attempts

### 1.0.4
- Use @actions/core v1.2.6
- Fixes uploadChunk to throw an error if any unsuccessful response code is received

### 1.0.5
- Fix to ensure Windows cache paths get resolved correctly

### 1.0.6
- Make caching more verbose [#650](https://github.com/actions/toolkit/pull/650)
- Use GNU tar on macOS if available [#701](https://github.com/actions/toolkit/pull/701)

### 1.0.7
- Fixes permissions issue extracting archives with GNU tar on macOS ([issue](https://github.com/actions/cache/issues/527))

### 1.0.8
- Increase the allowed artifact cache size from 5GB to 10GB ([issue](https://github.com/actions/cache/discussions/497))

### 1.0.9
  - Use @azure/ms-rest-js v2.6.0
  - Use @azure/storage-blob v12.8.0

### 1.0.10
- Update `lockfileVersion` to `v2` in `package-lock.json [#1022](https://github.com/actions/toolkit/pull/1022)

### 1.0.11
- Fix file downloads > 2GB([issue](https://github.com/actions/cache/issues/773))

### 2.0.0
- Added support to check if Actions cache service feature is available or not [#1028](https://github.com/actions/toolkit/pull/1028)

### 2.0.3
- Update to v2.0.0 of `@actions/http-client`

### 2.0.4
- Update to v2.0.1 of `@actions/http-client` [#1087](https://github.com/actions/toolkit/pull/1087)

### 2.0.5
- Fix to avoid saving empty cache when no files are available for caching. ([issue](https://github.com/actions/cache/issues/624))

### 2.0.6
- Fix `Tar failed with error: The process '/usr/bin/tar' failed with exit code 1` issue when temp directory where tar is getting created is actually the subdirectory of the path mentioned by the user for caching. ([issue](https://github.com/actions/cache/issues/689))

### 3.0.0
- Updated actions/cache to suppress Actions cache server error and log warning for those error  [#1122](https://github.com/actions/toolkit/pull/1122)

### 3.0.1
- Fix [#833](https://github.com/actions/cache/issues/833) - cache doesn't work with github workspace directory.
- Fix [#809](https://github.com/actions/cache/issues/809) `zstd -d: no such file or directory` error on AWS self-hosted runners.

### 3.0.2
- Added 1 hour timeout for the download stuck issue [#810](https://github.com/actions/cache/issues/810).

### 3.0.3
- Bug fixes for download stuck issue [#810](https://github.com/actions/cache/issues/810).

### 3.0.4
- Fix zstd not working for windows on gnu tar in issues [#888](https://github.com/actions/cache/issues/888) and [#891](https://github.com/actions/cache/issues/891).
- Allowing users to provide a custom timeout as input for aborting download of a cache segment using an environment variable `SEGMENT_DOWNLOAD_TIMEOUT_MIN`. Default is 60 minutes.
