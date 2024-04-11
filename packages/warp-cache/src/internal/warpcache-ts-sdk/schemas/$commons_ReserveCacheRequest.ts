/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ReserveCacheRequest = {
    properties: {
        cache_key: {
            type: 'string',
            isRequired: true,
        },
        content_type: {
            type: 'string',
        },
        number_of_chunks: {
            type: 'number',
        },
    },
} as const;