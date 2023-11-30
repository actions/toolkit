import {deleteCache, restoreCache, saveCache} from './cache'

process.env['WARP_CACHE_URL'] = 'http://localhost:8002'
process.env['RUNNER_TEMP'] = '/Users/prajjwal/Repos/warpbuild/playground/tmp_fs'
process.env['NODE_DEBUG'] = 'http'

// saveCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key',
//   true
// )

// restoreCache(
//   ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
//   'test-fs-local-key',
//   [],
//   {},
//   true
// )

// deleteCache(['test-fs-local-key'])
