# `@actions/cache`

> Functions necessary for caching dependencies and build outputs to improve workflow execution time.

See ["Caching dependencies to speed up workflows"](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows) for how caching works.

Note that GitHub will remove any cache entries that have not been accessed in over 7 days. There is no limit on the number of caches you can store, but the total size of all caches in a repository is limited to 10 GB. If you exceed this limit, GitHub will save your cache but will begin evicting caches until the total size is less than 10 GB.

## ⚠️ Important changes

The cache backend service has been rewritten from the ground up for improved performance and reliability. The [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache) package now integrates with the new cache service (v2) APIs.

The new service will gradually roll out as of **February 1st, 2025**. The legacy service will also be sunset on the same date. Changes in this release are **fully backward compatible**.

**All previous versions of this package will be deprecated**. We recommend upgrading to version `4.0.0` as soon as possible before **February 1st, 2025.**

If you do not upgrade, all workflow runs using any of the deprecated [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache) packages will fail.

Upgrading to the recommended version should not break or require any changes to your workflows beyond updating your `package.json` to version `4.0.0`.

Read more about the change & access the migration guide: [reference to the announcement](https://github.com/actions/toolkit/discussions/1890).

## Usage

This package is used by the v2+ versions of our first party cache action. You can find an example implementation in the cache repo [here](https://github.com/actions/cache).

#### Save Cache

Saves a cache containing the files in `paths` using the `key` provided. The files would be compressed using zstandard compression algorithm if zstd is installed, otherwise gzip is used. Function returns the cache id if the cache was saved succesfully and throws an error if cache upload fails.

```js
const cache = require('@actions/cache');
const paths = [
    'node_modules',
    'packages/*/node_modules/'
]
const key = 'npm-foobar-d5ea0750'
const cacheId = await cache.saveCache(paths, key)
```

#### Restore Cache

Restores a cache based on `key` and `restoreKeys` to the `paths` provided. Function returns the cache key for cache hit and returns undefined if cache not found.

```js
const cache = require('@actions/cache');
const paths = [
    'node_modules',
    'packages/*/node_modules/'
]
const key = 'npm-foobar-d5ea0750'
const restoreKeys = [
    'npm-foobar-',
    'npm-'
]
const cacheKey = await cache.restoreCache(paths, key, restoreKeys)
```

##### Cache segment restore timeout

A cache gets downloaded in multiple segments of fixed sizes (now `128MB` to fail-fast, previously `1GB` for a `32-bit` runner and `2GB` for a `64-bit` runner were used). Sometimes, a segment download gets stuck which causes the workflow job to be stuck forever and fail. Version `v3.0.4` of cache package introduces a segment download timeout. The segment download timeout will allow the segment download to get aborted and hence allow the job to proceed with a cache miss.

Default value of this timeout is 10 minutes (starting `v3.2.1` and higher, previously 60 minutes in versions between `v.3.0.4` and `v3.2.0`, both included) and can be customized by specifying an [environment variable](https://docs.github.com/en/actions/learn-github-actions/environment-variables) named `SEGMENT_DOWNLOAD_TIMEOUT_MINS` with timeout value in minutes.
