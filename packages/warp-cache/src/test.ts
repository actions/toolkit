import {deleteCache, restoreCache, saveCache} from './cache'

process.env['WARPBUILD_CACHE_URL'] = 'http://localhost:8002'
process.env['RUNNER_TEMP'] = '/Users/prajjwal/Repos/warpbuild/playground/tmp_fs'
process.env['NODE_DEBUG'] = 'http'
process.env['WARPBUILD_RUNNER_VERIFICATION_TOKEN'] =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTMwNzE5ODgsInJlcG8iOiJiZW5jaG1hcmtzIiwicmVwb093bmVyIjoiV2FycEJ1aWxkcyIsIngtd2FycGJ1aWxkLW9yZ2FuaXphdGlvbi1pZCI6IndmbW4wODBlaWY4cm5pd3EifQ.Wat-RATKl_KB39SF6egch3nF3_dD8hDE3lbl9wm7AyBUs9pUNEDejJtgHO0xQfGvSN-qRTPbJ_glHKPUIRHE3w'

saveCache(
  ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
  'test-fs-local-key',
  true
)

restoreCache(
  ['/Users/prajjwal/Repos/warpbuild/playground/test_fs'],
  'test-fs-local-key',
  [],
  {},
  true
)

deleteCache(['test-fs-local-key'])
