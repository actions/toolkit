export interface FileDetails {
    /**
     * Full path to the file causing the issue.
     * Note: the agent will translate to the proper repo when posting
     *       the issue back to the timeline
     */
    File: string,
    Line: number,
    Column: number
}

/**
 * The code to exit an action
 * Spec: https://github.com/github/dreamlifter/blob/master/docs/actions-model.md#exit-codes
 */
export enum ExitCode {
    /**
     * A code indicating that the action was successful
     */
    Success = 0,
  
    /**
     * A code indicating that the action was a failure
     */
    Failure = 1,
  
    /**
     * A code indicating that the action is complete, but neither succeeded nor failed
     */
    Neutral = 78
}