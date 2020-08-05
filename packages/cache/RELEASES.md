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
