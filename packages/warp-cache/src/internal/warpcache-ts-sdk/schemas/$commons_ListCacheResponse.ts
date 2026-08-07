/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ListCacheResponse = {
    properties: {
        cache_entries_with_stat: {
            type: 'array',
            contains: {
                type: 'commons_CacheEntryWithStat',
            },
        },
        sortable_fields: {
            type: 'dictionary',
            contains: {
                type: 'string',
            },
        },
        total_entries: {
            type: 'number',
        },
        total_pages: {
            type: 'number',
        },
        unique_vcs_refs: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;