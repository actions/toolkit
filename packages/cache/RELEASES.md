# @actions/cache Releases

### 4.0.5

- Reintroduce @protobuf-ts/runtime-rpc as a runtime dependency [#2113](https://github.com/actions/toolkit/pull/2113)

### 4.0.4

⚠️ Faulty patch release. Upgrade to 4.0.5 instead.

- Optimized cache dependencies by moving `@protobuf-ts/plugin` to dev dependencies [#2106](https://github.com/actions/toolkit/pull/2106)
- Improved cache service availability determination for different cache service versions (v1 and v2) [#2100](https://github.com/actions/toolkit/pull/2100)
- Enhanced server error handling: 5xx HTTP errors are now logged as errors instead of warnings [#2099](https://github.com/actions/toolkit/pull/2099)
- Fixed cache hit logging to properly distinguish between exact key matches and restore key matches [#2101](https://github.com/actions/toolkit/pull/2101)

### 4.0.3

- Added masking for Shared Access Signature (SAS) cache entry URLs [#1982](https://github.com/actions/toolkit/pull/1982)
- Improved debugging by logging both the cache version alongside the keys requested when a cache restore fails [#1994](https://github.com/actions/toolkit/pull/1994)

### 4.0.2

- Wrap create failures in ReserveCacheError [#1966](https://github.com/actions/toolkit/pull/1966)

### 4.0.1

- Remove runtime dependency on `twirp-ts` [#1947](https://github.com/actions/toolkit/pull/1947)
- Cache miss as debug, not warning annotation [#1954](https://github.com/actions/toolkit/pull/1954)

### 4.0.0

#### Important changes

The cache backend service has been rewritten from the ground up for improved performance and reliability. The [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache) package now integrates with the new cache service (v2) APIs.

The new service will gradually roll out as of **February 1st, 2025**. The legacy service will also be sunset on the same date. Changes in this release are **fully backward compatible**.

**All previous versions of this package will be deprecated**. We recommend upgrading to version `4.0.0` as soon as possible before **February 1st, 2025.**

If you do not upgrade, all workflow runs using any of the deprecated [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache) packages will fail.

Upgrading to the recommended version should not break or require any changes to your workflows beyond updating your `package.json` to version `4.0.0`.

Read more about the change & access the migration guide: [reference to the announcement](https://github.com/actions/toolkit/discussions/1890).

#### Minor changes

- Update `@actions/core` to `1.11.0`
- Update `semver` `6.3.1`
- Add `twirp-ts` `2.5.0` to dependencies

### 3.3.0

- Update `@actions/core` to `1.11.1`
- Remove dependency on `uuid` package [#1824](https://github.com/actions/toolkit/pull/1824), [#1842](https://github.com/actions/toolkit/pull/1842)

### 3.2.4

- Updated `isGhes` check to include `.ghe.com` and `.ghe.localhost` as accepted hosts

### 3.2.3

- Fixed a bug that mutated path arguments to `getCacheVersion` [#1378](https://github.com/actions/toolkit/pull/1378)

### 3.2.2

- Add new default cache download method to improve performance and reduce hangs [#1484](https://github.com/actions/toolkit/pull/1484)

### 3.2.1

- Updated @azure/storage-blob to `v12.13.0`

### 3.2.0

- Add `lookupOnly` to cache restore `DownloadOptions`.

### 3.1.4

- Fix zstd not being used due to `zstd --version` output change in zstd 1.5.4 release. See [#1353](https://github.com/actions/toolkit/pull/1353).

### 3.1.3

- Fix to prevent from setting MYSYS environement variable globally [#1329](https://github.com/actions/toolkit/pull/1329).

### 3.1.2

- Fix issue with symlink restoration on windows.

### 3.1.1

- Reverted changes in 3.1.0 to fix issue with symlink restoration on windows.
- Added support for verbose logging about cache version during cache miss.

### 3.1.0

- Update actions/cache on windows to use gnu tar and zstd by default
- Update actions/cache on windows to fallback to bsdtar and zstd if gnu tar is not available.
- Added support for fallback to gzip to restore old caches on windows.

### 3.1.0-beta.3

- Bug Fixes for fallback to gzip to restore old caches on windows and bsdtar if gnutar is not available.

### 3.1.0-beta.2

- Added support for fallback to gzip to restore old caches on windows.

### 3.0.6

- Added `@azure/abort-controller` to dependencies to fix compatibility issue with ESM [#1208](https://github.com/actions/toolkit/issues/1208)

### 3.0.5

- Update `@actions/cache` to use `@actions/core@^1.10.0`

### 3.0.4

- Fix zstd not working for windows on gnu tar in issues [#888](https://github.com/actions/cache/issues/888) and [#891](https://github.com/actions/cache/issues/891).
- Allowing users to provide a custom timeout as input for aborting download of a cache segment using an environment variable `SEGMENT_DOWNLOAD_TIMEOUT_MINS`. Default is 60 minutes.

### 3.0.3

- Bug fixes for download stuck issue [#810](https://github.com/actions/cache/issues/810).

### 3.0.2

- Added 1 hour timeout for the download stuck issue [#810](https://github.com/actions/cache/issues/810).

### 3.0.1

- Fix [#833](https://github.com/actions/cache/issues/833) - cache doesn't work with github workspace directory.
- Fix [#809](https://github.com/actions/cache/issues/809) `zstd -d: no such file or directory` error on AWS self-hosted runners.

### 3.0.0

- Updated actions/cache to suppress Actions cache server error and log warning for those error  [#1122](https://github.com/actions/toolkit/pull/1122)

### 2.0.6

- Fix `Tar failed with error: The process '/usr/bin/tar' failed with exit code 1` issue when temp directory where tar is getting created is actually the subdirectory of the path mentioned by the user for caching. ([issue](https://github.com/actions/cache/issues/689))

### 2.0.5

- Fix to avoid saving empty cache when no files are available for caching. ([issue](https://github.com/actions/cache/issues/624))

### 2.0.4

- Update to v2.0.1 of `@actions/http-client` [#1087](https://github.com/actions/toolkit/pull/1087)

### 2.0.3

- Update to v2.0.0 of `@actions/http-client`

### 2.0.0

- Added support to check if Actions cache service feature is available or not [#1028](https://github.com/actions/toolkit/pull/1028)

### 1.0.11

- Fix file downloads > 2GB([issue](https://github.com/actions/cache/issues/773))

### 1.0.10

- Update `lockfileVersion` to `v2` in `package-lock.json [#1022](https://github.com/actions/toolkit/pull/1022)

### 1.0.9

- Use @azure/ms-rest-js v2.6.0
- Use @azure/storage-blob v12.8.0

### 1.0.8

- Increase the allowed artifact cache size from 5GB to 10GB ([issue](https://github.com/actions/cache/discussions/497))

### 1.0.7

- Fixes permissions issue extracting archives with GNU tar on macOS ([issue](https://github.com/actions/cache/issues/527))

### 1.0.6

- Make caching more verbose [#650](https://github.com/actions/toolkit/pull/650)
- Use GNU tar on macOS if available [#701](https://github.com/actions/toolkit/pull/701)

### 1.0.5

- Fix to ensure Windows cache paths get resolved correctly

### 1.0.4

- Use @actions/core v1.2.6
- Fixes uploadChunk to throw an error if any unsuccessful response code is received

### 1.0.3

- Use http-client v1.0.9
- Fixes error handling so retries are not attempted on non-retryable errors (409 Conflict, for example)
- Adds 5 second delay between retry attempts

### 1.0.2

- Use posix archive format to add support for some tools

### 1.0.1

- Fix bug in downloading large files (> 2 GBs) with the Azure SDK

### 1.0.0

- Downloads Azure-hosted caches using the Azure SDK for speed and reliability
- Displays download progress
- Includes changes that break compatibility with earlier versions, including:
  - `retry`, `retryTypedResponse`, and `retryHttpClientResponse` moved from `cacheHttpClient` to `requestUtils`

### 0.2.1

- Fix to await async function getCompressionMethod
  
### 0.2.0

- Fixes issues with the zstd compression algorithm on Windows and Ubuntu 16.04 [#469](https://github.com/actions/toolkit/pull/469)
  
### 0.1.0

- Initial release
