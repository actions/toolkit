# `@actions/cache`

> Functions necessary for caching dependencies and build outputs to improve workflow execution time.

## Usage

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

Saves a cache containing the files in `paths` using the `key` provided. Function returns the cache id if the cache was save succesfully.

```js
const cache = require('@actions/cache');
const paths = [
    'node_modules',
    'packages/*/node_modules/'
]
const key = 'npm-foobar-d5ea0750'
const cacheId = await cache.saveCache(paths, key)
```

## Additional Documentation

See ["Caching dependencies to speed up workflows"](https://help.github.com/github/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows).