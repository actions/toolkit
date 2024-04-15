/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ReserveCacheRequest = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
        },
        cache_key: {
            type: 'string',
            isRequired: true,
        },
        cache_version: {
            type: 'string',
            isRequired: true,
        },
        content_type: {
            type: 'string',
        },
        number_of_chunks: {
            type: 'number',
        },
        vcs_ref: {
            type: 'string',
        },
        vcs_repository: {
            type: 'string',
        },
    },
} as const;