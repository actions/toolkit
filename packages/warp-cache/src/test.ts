import {exec, spawn} from 'child_process'
import {deleteCache, restoreCache, saveCache} from './cache'
import {downloadCacheStreamingGCP} from './internal/downloadUtils'

import fs, {write} from 'fs'
import {extractStreamingTar} from './internal/tar'
import {CompressionMethod} from './internal/constants'

process.env['WARPBUILD_CACHE_URL'] = 'http://localhost:8002'
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

process.env['GCP_ACCESS_TOKEN'] =
  'ya29.c.c0AY_VpZgcQopWxkSf9wIIo9NED0YFh3VIgZ1wx1ulvSCrq5iTiZWbrRGPej2vA835U2HkNdrLwaVKFLeL57v1s-guzSvihNnHMMJ4wUPJHZPQd-CJ90i6F0NYcjQuv7SC2EBkaKciM-Act0IDygPwzwwixCe-4iCxcUv3YUysZcee9Qknxq5UBPfGjqQArVKifC2fScJ7HnBmbbSc8t1mDp9mLiIpax9V31anOQ-4QK1kqSgi4gh0m-Cd7v24S7Kfc5IEcQLrVyI62W4Y4HywRJ2V_qBx3ZKFMmO1lV5Tl3wHX40XyD1J2Cc6kXbF4LHHPcMnRf85ylaXaUGMwDNlkDPFHRJmOkWnZF8-v_Y4868-Mmektdl8khWvCQwGSLHo_jCKehCJZl1qK1gzNfie7Rgm9qbooMAEg1KkPPiDBmMY_WUsBo1-a0vuHrE90IhtvKI_TNTeH-pUDjSFMsbgrhnbGu5oN6DXk--WyjHy9slW6r8TDjB8UjPE2uiaGbYrQZsRPoaKVAxVylc9tFONyPwJ10MUerPq3ESq49QUASdasuYCef0CZ_R3kJyIMQe7p6WBfOZ0L11ZTz_tnFn1Oa8JGHvYl1xvx79EbHjo4mvyr5WTAXa42g-gCnPnJFLaN649DRZbdRzbbc3-bQbqFuictuoSQmOjhrqW6_0_44wVhlga9Ok9kZ4_lx6Oqvq9SiI6IxIJSBVnXet3MgzoRdJur8Ws766sinJ_iFkZdsQdj2IQ_hj74vh61v1i84xIZY-bp-IrvQQf_vZm6bbBZXxaXhiVphpij7nY5Rz3qS2d0e3byc1iUW63jXlY1iIhlvsd1i2Zd4YVyQrfgSy_zpuXJOqhS1MwBrkddb4F-r3wQtRJ1ttmbpSJOpeYzewzSeVopk8pmOaUSd0rS4qQkY1UdhQoavyn54VMj5U8BiOkjo-wV2MUXl0FlVF7u3-c3vUhlZ1JrMj6xiWFXys_QBMtU55jMe31UV-saSFxM7f1-xk1_2xoou8'

const readStream = downloadCacheStreamingGCP(
  'gs://cache-bench-test/custom_modules.tar.zst'
)

extractStreamingTar(
  readStream!,
  '/tmp/custom_modules',
  CompressionMethod.ZstdWithoutLong
)
  .then(() => {
    console.log('done')
  })
  .catch(err => {
    console.log(err)
  })
