/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheStatsResponse = {
    properties: {
        average_cache_operations: {
            type: 'number',
        },
        average_cache_usage: {
            type: 'number',
        },
        current_total_cache_size: {
            type: 'number',
        },
        daily_breakdown: {
            type: 'array',
            contains: {
                type: 'commons_DailyOperationsBreakdown',
            },
        },
        total_cache_operations: {
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