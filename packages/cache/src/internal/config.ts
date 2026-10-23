// NOTE: isGhes() here is intentionally identical to the artifact package's.
// On forges this now returns false, so getCacheServiceVersion() honors
// ACTIONS_CACHE_SERVICE_V2. Forges that set that flag without implementing
// the cache v2 CacheService Twirp (see gitea#33393) will fail until they
// implement it or stop setting the flag. The client-side 10GB cap in cache.ts
// also becomes active on forges. These are accepted tradeoffs of making the
// vendor flag authoritative.
export function isGhes(): boolean {
  // Forge runners (Forgejo, Gitea) self-identify via these flags. They are not
  // GitHub Enterprise Server and must not be misclassified as GHES.
  if (process.env['FORGEJO_ACTIONS'] || process.env['GITEA_ACTIONS']) {
    return false
  }

  // Optional operator-set vendor override. No runner emits this today; it is an
  // explicit escape hatch for runners that set neither forge flag.
  const vendor = (process.env['ACTIONS_VENDOR'] || '').trim().toLowerCase()
  if (vendor === 'github') return false
  if (vendor === 'ghes') return true
  // Unknown/non-empty vendors fall through to the hostname heuristic; they do
  // NOT auto-disable the GHES block (avoids a typo/spoof silently unblocking).

  const ghUrl = new URL(
    process.env['GITHUB_SERVER_URL'] || 'https://github.com'
  )

  const hostname = ghUrl.hostname.trimEnd().toUpperCase()
  const isGitHubHost = hostname === 'GITHUB.COM'
  const isGheHost = hostname.endsWith('.GHE.COM')
  const isLocalHost = hostname.endsWith('.LOCALHOST')

  return !isGitHubHost && !isGheHost && !isLocalHost
}

export function getCacheServiceVersion(): string {
  // Cache service v2 is not supported on GHES. We will default to
  // cache service v1 even if the feature flag was enabled by user.
  if (isGhes()) return 'v1'

  return process.env['ACTIONS_CACHE_SERVICE_V2'] ? 'v2' : 'v1'
}

// The cache-mode lattice: readable = {read, write}, writable = {write,
// write-only}, none = neither.
const KNOWN_CACHE_MODES = ['none', 'read', 'write', 'write-only']

// The effective cache-mode exported by the runner, or '' when not set.
export function getCacheMode(): string {
  return (process.env['ACTIONS_CACHE_MODE'] || '').trim().toLowerCase()
}

// Unset or unrecognized modes are permissive so behavior matches today.
export function isCacheReadable(mode: string): boolean {
  if (!KNOWN_CACHE_MODES.includes(mode)) return true
  return mode === 'read' || mode === 'write'
}

export function isCacheWritable(mode: string): boolean {
  if (!KNOWN_CACHE_MODES.includes(mode)) return true
  return mode === 'write' || mode === 'write-only'
}

export function getCacheServiceURL(): string {
  const version = getCacheServiceVersion()

  // Based on the version of the cache service, we will determine which
  // URL to use.
  switch (version) {
    case 'v1':
      return (
        process.env['ACTIONS_CACHE_URL'] ||
        process.env['ACTIONS_RESULTS_URL'] ||
        ''
      )
    case 'v2':
      return process.env['ACTIONS_RESULTS_URL'] || ''
    default:
      throw new Error(`Unsupported cache service version: ${version}`)
  }
}
