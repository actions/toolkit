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
