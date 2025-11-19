import {deleteCache, restoreCache, saveCache} from './cache'
import {getCacheVersion} from './internal/cacheHttpClient'
import {getCompressionMethod} from './internal/cacheUtils'

// process.env['WARPBUILD_CACHE_URL'] = 'https://cache.dev.warpbuild.dev'
process.env['WARPBUILD_CACHE_URL'] = 'http://localhost:8000'
// process.env['WARPBUILD_CACHE_URL'] =
//   'https://6134-36-255-234-176.ngrok-free.app'
process.env['RUNNER_TEMP'] = '/Users/prajjwal/Repos/warpbuild/playground/tmp_fs'
process.env['NODE_DEBUG'] = 'http'
process.env['RUNNER_DEBUG'] = '1'
process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN'] =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhYyI6Ilt7XCJTY29wZVwiOlwicmVmcy9oZWFkcy9tYWluXCIsXCJQZXJtaXNzaW9uXCI6M31dIiwiY29ubmVjdGlvbklkIjoiMmVkYTNiMjYtYzY5OC00YjQ5LWFjMWUtYjdhNDIyOTEyM2FiIiwiZXhwIjoxNzI5NTAwNzU5LCJuYmYiOjE3MjkyNDE1NTksInJ1bm5lcklkIjoid2FycGRldi14NjQtdzk3eng5aHIwZ2xjeW45ZiIsInN0YWNrSWQiOiJ3aHhnaWNrZHhlbTJjN3oxIiwieC13YXJwYnVpbGQtb3JnYW5pemF0aW9uLWlkIjoid2ZtbjA4MGVpZjhybml3cSJ9.YwIjh-1-u9DjauOJJNsqQ3RohbenYe1Vr00LrfZHje1bXpixBWe6I89hy0dzuko8EGq4VbtE2QNAPmankJpwxA'
process.env['GITHUB_REPOSITORY'] = 'Warpbuilds/kitchen-sink'
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

deleteCache(
  ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
  'test-fs-local-key',
  true,
  false
)
