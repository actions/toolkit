import {version} from './package-version.cjs'

export const getUserAgent = (): string => {
  const baseUserAgent = `@actions/attest-${version}`

  const orchId = process.env['ACTIONS_ORCHESTRATION_ID']
  if (orchId) {
    // Sanitize the orchestration ID to ensure it contains only valid characters
    // Valid characters: 0-9, a-z, _, -, .
    const sanitizedId = orchId.replace(/[^a-z0-9_.-]/gi, '_')
    return `${baseUserAgent} actions_orchestration_id/${sanitizedId}`
  }

  return baseUserAgent
}
