import {getIDToken} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import * as jose from 'jose'

const OIDC_AUDIENCE = 'nobody'

const REQUIRED_CLAIMS = [
  'iss',
  'ref',
  'sha',
  'repository',
  'event_name',
  'job_workflow_ref',
  'workflow_ref',
  'repository_id',
  'repository_owner_id',
  'runner_environment',
  'run_id',
  'run_attempt'
] as const

export type ClaimSet = {[K in (typeof REQUIRED_CLAIMS)[number]]: string}

type OIDCConfig = {
  jwks_uri: string
}

export const getIDTokenClaims = async (issuer: string): Promise<ClaimSet> => {
  try {
    const token = await getIDToken(OIDC_AUDIENCE)
    const claims = await decodeOIDCToken(token, issuer)
    assertClaimSet(claims)
    return claims
  } catch (error) {
    throw new Error(`Failed to get ID token: ${error.message}`)
  }
}

const decodeOIDCToken = async (
  token: string,
  issuer: string
): Promise<jose.JWTPayload> => {
  // Verify and decode token
  const jwks = jose.createLocalJWKSet(await getJWKS(issuer))
  const {payload} = await jose.jwtVerify(token, jwks, {
    audience: OIDC_AUDIENCE,
    issuer
  })

  return payload
}

const getJWKS = async (issuer: string): Promise<jose.JSONWebKeySet> => {
  const client = new HttpClient('@actions/attest')
  const config = await client.getJson<OIDCConfig>(
    `${issuer}/.well-known/openid-configuration`
  )

  if (!config.result) {
    throw new Error('No OpenID configuration found')
  }

  const jwks = await client.getJson<jose.JSONWebKeySet>(config.result.jwks_uri)

  if (!jwks.result) {
    throw new Error('No JWKS found for issuer')
  }

  return jwks.result
}

function assertClaimSet(claims: jose.JWTPayload): asserts claims is ClaimSet {
  const missingClaims: string[] = []

  for (const claim of REQUIRED_CLAIMS) {
    if (!(claim in claims)) {
      missingClaims.push(claim)
    }
  }

  if (missingClaims.length > 0) {
    throw new Error(`Missing claims: ${missingClaims.join(', ')}`)
  }
}
