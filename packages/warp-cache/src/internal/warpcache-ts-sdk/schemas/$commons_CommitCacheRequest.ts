/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_CommitCacheRequest = {
    properties: {
        cache_key: {
            type: 'string',
            isRequired: true,
        },
        cache_version: {
            type: 'string',
            isRequired: true,
        },
        os: {
            type: 'string',
            isRequired: true,
        },
        parts: {
            type: 'array',
            contains: {
                type: 'types_CompletedPart',
            },
            isRequired: true,
        },
        upload_id: {
            type: 'string',
        },
        upload_key: {
            type: 'string',
        },
        vcs_type: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;