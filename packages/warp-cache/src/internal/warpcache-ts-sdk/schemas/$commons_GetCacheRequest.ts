/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheRequest = {
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
        restore_keys: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        vcs_ref: {
            type: 'string',
        },
        vcs_repository: {
            type: 'string',
        },
    },
} as const;