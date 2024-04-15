/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_DeleteCacheRequest = {
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
        vcs_ref: {
            type: 'string',
        },
        vcs_repository: {
            type: 'string',
        },
    },
} as const;