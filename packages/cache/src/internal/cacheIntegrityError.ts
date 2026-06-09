import {PathValidationViolation} from './pathValidation.js'

/**
 * Reason codes for cache integrity failures. Useful for callers (e.g. the
 * `actions/cache` action) that want to distinguish between recoverable
 * conditions and unambiguous corruption.
 */
export type CacheIntegrityErrorCode =
  | 'PARSE_ERROR' // archive could not be opened or parsed
  | 'PATH_VIOLATION' // path validation rejected one or more entries
  | 'CHECKSUM_MISMATCH' // reserved for future checksum-based integrity checks

/**
 * Thrown when a downloaded cache archive fails an integrity check. Today
 * this covers parse errors and path-validation failures (when the caller
 * has opted into `pathValidation: 'error'`).
 *
 * Callers can `instanceof`-check this class to distinguish integrity
 * failures from transient transport errors.
 */
export class CacheIntegrityError extends Error {
  readonly code: CacheIntegrityErrorCode
  readonly violations?: PathValidationViolation[]

  constructor(
    code: CacheIntegrityErrorCode,
    message: string,
    violations?: PathValidationViolation[]
  ) {
    super(message)
    this.name = 'CacheIntegrityError'
    this.code = code
    this.violations = violations
    Object.setPrototypeOf(this, CacheIntegrityError.prototype)
  }
}
