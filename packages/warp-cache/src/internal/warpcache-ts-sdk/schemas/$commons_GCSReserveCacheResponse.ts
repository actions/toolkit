/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GCSReserveCacheResponse = {
    properties: {
        bucket_name: {
            type: 'string',
        },
        cache_key: {
            type: 'string',
            isRequired: true,
        },
        method: {
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