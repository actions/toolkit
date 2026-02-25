import * as github from '@actions/github'
import {retry} from '@octokit/plugin-retry'
import {RequestHeaders} from '@octokit/types'
import {version} from './package-version.cjs'

const CREATE_ATTESTATION_REQUEST = 'POST /repos/{owner}/{repo}/attestations'
const DEFAULT_RETRY_COUNT = 5

export type WriteOptions = {
  retry?: number
  headers?: RequestHeaders
}
/**
 * Writes an attestation to the repository's attestations endpoint.
 * @param attestation - The attestation to write.
 * @param token - The GitHub token for authentication.
 * @returns The ID of the attestation.
 * @throws Error if the attestation fails to persist.
 */
export const writeAttestation = async (
  attestation: unknown,
  token: string,
  options: WriteOptions = {}
): Promise<string> => {
  const retries = options.retry ?? DEFAULT_RETRY_COUNT
  const octokit = github.getOctokit(token, {retry: {retries}}, retry)

  const headers = {
    'User-Agent': getUserAgent(),
    ...options.headers
  }

  try {
    const response = await octokit.request(CREATE_ATTESTATION_REQUEST, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      headers,
      bundle: attestation as {
        mediaType?: string
        verificationMaterial?: {[key: string]: unknown}
        dsseEnvelope?: {[key: string]: unknown}
      }
    })

    const data =
      typeof response.data == 'string'
        ? JSON.parse(response.data)
        : response.data
    return data?.id
  } catch (err) {
    const message = err instanceof Error ? err.message : err
    throw new Error(`Failed to persist attestation: ${message}`)
  }
}

const getUserAgent = (): string => {
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
