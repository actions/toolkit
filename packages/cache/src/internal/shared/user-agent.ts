// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const packageJson = require('../../../package.json')

/**
 * Ensure that this User Agent String is used in all HTTP calls so that we can monitor telemetry between different versions of this package
 */
export function getUserAgentString(): string {
  return `@actions/cache-${packageJson.version}`
}
