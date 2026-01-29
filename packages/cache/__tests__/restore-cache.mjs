#!/usr/bin/env node
// Helper script to restore cache for e2e testing
import * as cache from '../lib/cache.js'

const [prefix, runId, useAzureSdk] = process.argv.slice(2)

if (!prefix || !runId) {
  console.error('Usage: restore-cache.mjs <prefix> <runId> [useAzureSdk]')
  process.exit(1)
}

const key = `test-${prefix}-${runId}`
const paths = ['test-cache', '~/test-cache']
const options = {useAzureSdk: useAzureSdk !== 'false'}

console.log(`Restoring cache with key: ${key}`)
console.log(`Paths: ${paths.join(', ')}`)
console.log(`Using Azure SDK: ${options.useAzureSdk}`)

try {
  const restoredKey = await cache.restoreCache(paths, key, [], options)

  if (restoredKey) {
    console.log(`Cache restored with key: ${restoredKey}`)
  } else {
    console.error('Cache not found')
    process.exit(1)
  }
} catch (error) {
  console.error('Error restoring cache:', error)
  process.exit(1)
}
