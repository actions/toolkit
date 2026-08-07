/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ShortLivedToken = {
    properties: {
        access_token: {
            type: 'string',
            description: `AccessToken contains the short lived access token to be used to connect to the GCP storage backend`,
        },
        expires_at: {
            type: 'string',
            description: `ExpiresAt contains the expiry time of the short lived access token
            format: date-time`,
        },
    },
} as const;