export interface UploadOptions {
    /**
     * Duration after which artifact will expire in days.
     *
     * By default artifact expires after 90 days:
     * https://docs.github.com/en/actions/configuring-and-managing-workflows/persisting-workflow-data-using-artifacts#downloading-and-deleting-artifacts-after-a-workflow-run-is-complete
     *
     * Use this option to override the default expiry.
     *
     * Min value: 1
     * Max value: 90 unless changed by repository setting
     *
     * If this is set to a greater value than the retention settings allowed, the retention on artifacts
     * will be reduced to match the max value allowed on server, and the upload process will continue. An
     * input of 0 assumes default retention setting.
     */
    retentionDays?: number
}