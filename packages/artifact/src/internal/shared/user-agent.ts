import {version} from './package-version.cjs'

/**
 * Ensure that this User Agent String is used in all HTTP calls so that we can monitor telemetry between different versions of this package
 */
export function getUserAgentString(): string {
  return `@actions/artifact-${version}`
}
