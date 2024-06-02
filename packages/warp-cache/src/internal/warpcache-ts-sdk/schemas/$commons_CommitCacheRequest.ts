/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_CommitCacheRequest = {
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
        parts: {
            type: 'array',
            contains: {
                type: 'types_CompletedPart',
            },
            isRequired: true,
        },
        upload_id: {
            type: 'string',
            description: `UploadID

             * This is not supported for GCS cache. When passed this will be ignored. *`,
        },
        upload_key: {
            type: 'string',
            description: `UploadKey

             * This is not supported for GCS cache. When passed this will be ignored. *`,
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
        vcs_type: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;