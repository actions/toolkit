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

const maxRetries = 3
const retryDelayMs = 5000

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    console.log(`Attempt ${attempt} of ${maxRetries}`)
    const restoredKey = await cache.restoreCache(paths, key, [], options)

    if (restoredKey) {
      console.log(`Cache restored with key: ${restoredKey}`)
      process.exit(0)
    } else {
      console.log('Cache not found on this attempt')
    }
  } catch (error) {
    console.error(`Error on attempt ${attempt}:`, error.message)
  }

  if (attempt < maxRetries) {
    console.log(`Waiting ${retryDelayMs / 1000}s before retry...`)
    await new Promise(resolve => setTimeout(resolve, retryDelayMs))
  }
}

console.error(`Failed to restore cache after ${maxRetries} attempts`)
process.exit(1)
