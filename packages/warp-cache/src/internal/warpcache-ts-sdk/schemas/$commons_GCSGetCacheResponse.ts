/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GCSGetCacheResponse = {
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
            description: `Method contains the auth method to be used to connect to the GCP storage backend`,
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