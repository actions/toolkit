import {OidcClient} from './oidc-utils.js'

export const getIDToken = async (aud?: string): Promise<string> => {
  return await OidcClient.getIDToken(aud)
}
