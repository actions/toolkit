#!/usr/bin/env node
// Helper script to save cache for e2e testing
import * as cache from '../lib/cache.js'

const [prefix, runId] = process.argv.slice(2)

if (!prefix || !runId) {
  console.error('Usage: save-cache.mjs <prefix> <runId>')
  process.exit(1)
}

const key = `test-${prefix}-${runId}`
const paths = ['test-cache', '~/test-cache']

console.log(`Saving cache with key: ${key}`)
console.log(`Paths: ${paths.join(', ')}`)

try {
  const cacheId = await cache.saveCache(paths, key)
  console.log(`Cache saved with ID: ${cacheId}`)
} catch (error) {
  console.error('Error saving cache:', error)
  process.exit(1)
}
