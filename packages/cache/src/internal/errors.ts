import {CacheReadDeniedMessagePrefix} from './constants.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class ReserveCacheError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReserveCacheError'
    Object.setPrototypeOf(this, ReserveCacheError.prototype)
  }
}

/**
 * Stable prefix the cache service writes into the cache reservation response
 * when the issuer downgraded the cache token to read-only (for example, because
 * the run was triggered by an untrusted event). saveCacheV1 / saveCacheV2
 * dispatch on this prefix to re-classify the failure as a CacheWriteDeniedError
 * so consumers and tests can distinguish a policy denial from other reservation
 * failures. Internally it is logged as a non-fatal warning like other
 * best-effort save failures.
 */
export const CACHE_WRITE_DENIED_PREFIX = 'cache write denied:'

/**
 * Raised when the cache backend refuses to reserve a writable cache entry
 * because the JWT issued for this run was scoped read-only (for example, the
 * run was triggered by an event the repository administrator classified as
 * untrusted). The service-supplied detail message always begins with
 * `cache write denied:` (the full error message includes additional context
 * like the cache key).
 *
 * Extends ReserveCacheError for source-compatibility: existing
 * `instanceof ReserveCacheError` checks and `typedError.name ===
 * ReserveCacheError.name` paths keep working, while consumers that want to
 * distinguish the policy case can match on this subclass.
 */
export class CacheWriteDeniedError extends ReserveCacheError {
  constructor(message: string) {
    super(message)
    this.name = 'CacheWriteDeniedError'
    Object.setPrototypeOf(this, CacheWriteDeniedError.prototype)
  }
}

// Re-exported from constants so consumers keep referencing it here; the shared
// value also drives detection in cacheHttpClient without duplicating the string.
export const CACHE_READ_DENIED_PREFIX = CacheReadDeniedMessagePrefix

// Raised when the cache backend denies a download URL because the run's token
// has no readable cache scopes. Caching is best-effort, so restoreCache logs a
// warning and reports a cache miss rather than rethrowing this.
export class CacheReadDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CacheReadDeniedError'
    Object.setPrototypeOf(this, CacheReadDeniedError.prototype)
  }
}

export class FinalizeCacheError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FinalizeCacheError'
    Object.setPrototypeOf(this, FinalizeCacheError.prototype)
  }
}
