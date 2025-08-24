/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheRequest = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
            description: `Annotations is a map of annotations that can be passed as additional
            context to the cache service. This is not stored in the cache but is published
            in events for tracking purposes.`,
        },
        cache_key: {
            type: 'string',
            isRequired: true,
        },
        cache_version: {
            type: 'string',
            isRequired: true,
        },
        provider: {
            type: 'string',
        },
        restore_branches: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        restore_keys: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        restore_repos: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        vcs_ref: {
            type: 'string',
            description: `VCSRef is the ref of the repository in vcs for which cache is being used.
            This can be a branch, git tag, or pull request ref.`,
        },
        vcs_repository: {
            type: 'string',
            description: `VCSRepository is the repository name in vcs.
            It can be of the format <organization>/<repository> or <repository>.
            While saving the entry, <organization>/ will be trimmed if passed.`,
        },
    },
} as const;