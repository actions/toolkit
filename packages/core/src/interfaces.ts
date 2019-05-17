/**
 * The code to exit an action
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

/**
 * Interface for exportVariable options
 */
export interface ExportOptions {
    /** Optional. Whether the variable should be marked as secret (will be masked from logs). Defaults to false */
    isSecret?: boolean;
}