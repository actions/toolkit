import * as github from '@actions/github'

const CREATE_ATTESTATION_REQUEST = 'POST /repos/{owner}/{repo}/attestations'

/**
 * Writes an attestation to the repository's attestations endpoint.
 * @param attestation - The attestation to write.
 * @param token - The GitHub token for authentication.
 * @returns The ID of the attestation.
 * @throws Error if the attestation fails to persist.
 */
export const writeAttestation = async (
  attestation: unknown,
  token: string
): Promise<string> => {
  const octokit = github.getOctokit(token)

  try {
    const response = await octokit.request(CREATE_ATTESTATION_REQUEST, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      data: {bundle: attestation}
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
