// Version is hardcoded to avoid issues with import.meta.url in Jest
const VERSION = '6.0.0'

/**
 * Ensure that this User Agent String is used in all HTTP calls so that we can monitor telemetry between different versions of this package
 */
export function getUserAgentString(): string {
  return `@actions/artifact-${VERSION}`
}
