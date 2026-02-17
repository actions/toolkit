/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GCSReserveCacheResponse = {
    properties: {
        bucket_name: {
            type: 'string',
        },
        cache_key: {
            type: 'string',
            description: `CacheKey is the resolved cache key which might contain some prefix or suffix
            in addition to the cache key provided by the user. This is the actual storage
            location in gcs.`,
            isRequired: true,
        },
        method: {
            type: 'string',
            description: `Method contains the auth method to be used to connect to the GCP storage backend`,
        },
        project_id: {
            type: 'string',
        },
        short_lived_token: {
            type: 'commons_ShortLivedToken',
        },
    },
} as const;