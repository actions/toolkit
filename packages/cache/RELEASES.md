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
