import {attest, AttestOptions} from './attest'
import {getIDTokenClaims} from './oidc'
import type {Attestation, Predicate} from './shared.types'

const SLSA_PREDICATE_V1_TYPE = 'https://slsa.dev/provenance/v1'
const GITHUB_BUILD_TYPE = 'https://actions.github.io/buildtypes/workflow/v1'

export type AttestProvenanceOptions = Omit<
  AttestOptions,
  'predicate' | 'predicateType'
> & {
  issuer?: string
}

/**
 * Builds an SLSA (Supply Chain Levels for Software Artifacts) provenance
 * predicate using the GitHub Actions Workflow build type.
 * https://slsa.dev/spec/v1.0/provenance
 * https://github.com/slsa-framework/github-actions-buildtypes/tree/main/workflow/v1
 * @param issuer - URL for the OIDC issuer. Defaults to the GitHub Actions token
 * issuer.
 * @returns The SLSA provenance predicate.
 */
export const buildSLSAProvenancePredicate = async (
  issuer?: string
): Promise<Predicate> => {
  const serverURL = process.env.GITHUB_SERVER_URL
  const claims = await getIDTokenClaims(issuer)

  // Split just the path and ref from the workflow string.
  // owner/repo/.github/workflows/main.yml@main =>
  //   .github/workflows/main.yml, main
  const [workflowPath] = claims.workflow_ref
    .replace(`${claims.repository}/`, '')
    .split('@')

  return {
    type: SLSA_PREDICATE_V1_TYPE,
    params: {
      buildDefinition: {
        buildType: GITHUB_BUILD_TYPE,
        externalParameters: {
          workflow: {
            ref: claims.ref,
            repository: `${serverURL}/${claims.repository}`,
            path: workflowPath
          }
        },
        internalParameters: {
          github: {
            event_name: claims.event_name,
            repository_id: claims.repository_id,
            repository_owner_id: claims.repository_owner_id,
            runner_environment: claims.runner_environment
          }
        },
        resolvedDependencies: [
          {
            uri: `git+${serverURL}/${claims.repository}@${claims.ref}`,
            digest: {
              gitCommit: claims.sha
            }
          }
        ]
      },
      runDetails: {
        builder: {
          id: `${serverURL}/${claims.job_workflow_ref}`
        },
        metadata: {
          invocationId: `${serverURL}/${claims.repository}/actions/runs/${claims.run_id}/attempts/${claims.run_attempt}`
        }
      }
    }
  }
}

/**
 * Attests the build provenance of the provided subject. Generates the SLSA
 * build provenance predicate, assembles it into an in-toto statement, and
 * attests it.
 *
 * @param options - The options for attesting the provenance.
 * @returns A promise that resolves to the attestation.
 */
export async function attestProvenance(
  options: AttestProvenanceOptions
): Promise<Attestation> {
  const predicate = await buildSLSAProvenancePredicate(options.issuer)
  return attest({
    ...options,
    predicateType: predicate.type,
    predicate: predicate.params
  })
}
