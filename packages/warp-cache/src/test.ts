import {deleteCache, restoreCache, saveCache} from './cache'
import {getCacheVersion} from './internal/cacheHttpClient'
import {getCompressionMethod} from './internal/cacheUtils'

process.env['WARPBUILD_CACHE_URL'] = 'https://cache.dev.warpbuild.dev'
// process.env['WARPBUILD_CACHE_URL'] = 'http://localhost:8000'
process.env['RUNNER_TEMP'] = '/Users/prajjwal/Repos/warpbuild/playground/tmp_fs'
process.env['NODE_DEBUG'] = 'http'
process.env['RUNNER_DEBUG'] = '1'
process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN'] =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTM0MTg3MzMsInJlcG8iOiJiZW5jaG1hcmtzIiwicmVwb093bmVyIjoiV2FycEJ1aWxkcyIsIngtd2FycGJ1aWxkLW9yZ2FuaXphdGlvbi1pZCI6IndmbW4wODBlaWY4cm5pd3EifQ.a435J9ccjs9V_FzQMdbwTvXOYU8hvRieYkXM7yumlWAJyxDTsq4mi3CP1Ob9y6nLEKr35TYqGwxKFSTOW1oxYQ'
process.env['GITHUB_REPOSITORY'] = 'Warpbuilds/backend-cache'
process.env['GITHUB_REF'] = 'refs/heads/main'

// saveCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key',
//   true
// )

// saveCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key-2',
//   true
// )

// saveCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key',
//   true,
//   true
// )

// restoreCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key',
//   ['test-fs'],
//   {},
//   true,
//   false
// )

// deleteCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key'
// )
