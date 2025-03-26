/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheStatsRequest = {
    properties: {
        search_text: {
            type: 'string',
        },
        stats_from_time: {
            type: 'string',
        },
        stats_to_time: {
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