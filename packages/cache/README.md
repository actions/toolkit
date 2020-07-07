# `@actions/cache`

> Functions necessary for caching dependencies and build outputs to improve workflow execution time.

See ["Caching dependencies to speed up workflows"](https://help.github.com/github/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows) for how caching works.

Note that GitHub will remove any cache entries that have not been accessed in over 7 days. There is no limit on the number of caches you can store, but the total size of all caches in a repository is limited to 5 GB. If you exceed this limit, GitHub will save your cache but will begin evicting caches until the total size is less than 5 GB.

## Usage

This package is used by the v2+ versions of our first party cache action. You can find an example implementation in the cache repo [here](https://github.com/actions/cache). 

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

