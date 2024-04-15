/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GCSGetCacheReponse = {
    properties: {
        bucket_name: {
            type: 'string',
        },
        cache_key: {
            type: 'string',
        },
        cache_version: {
            type: 'string',
        },
        method: {
            type: 'string',
        },
        pre_signed_url: {
            type: 'string',
        },
        project_id: {
            type: 'string',
        },
        short_lived_token: {
            type: 'commons_ShortLivedToken',
        },
    },
} as const;