/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ListCacheRequest = {
    properties: {
        page: {
            type: 'number',
        },
        per_page: {
            type: 'number',
        },
        search_text: {
            type: 'string',
        },
        sort_by_field: {
            type: 'string',
        },
        sort_order: {
            type: 'string',
        },
        vcs_refs: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        vcs_repositories: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;