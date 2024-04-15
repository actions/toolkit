import {deleteCache, restoreCache, saveCache} from './cache'
import {getCacheVersion} from './internal/cacheHttpClient'
import {getCompressionMethod} from './internal/cacheUtils'

process.env['WARPBUILD_CACHE_URL'] = 'https://cache.dev.warpbuild.dev'
// process.env['WARPBUILD_CACHE_URL'] = 'http://localhost:8000'
process.env['RUNNER_TEMP'] = '/Users/prajjwal/Repos/warpbuild/playground/tmp_fs'
process.env['NODE_DEBUG'] = 'http'
process.env['RUNNER_DEBUG'] = '1'
process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN'] = '<Set_token_here>'
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
//   'test-fs-local-key-3',
//   ['test-fs'],
//   {},
//   true,
//   false
// )

// deleteCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key'
// )
