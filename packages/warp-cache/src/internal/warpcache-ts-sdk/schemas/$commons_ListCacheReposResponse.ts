/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ListCacheReposResponse = {
    properties: {
        vcs_repositories: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;