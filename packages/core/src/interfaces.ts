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
 * Interface for getInput options
 */
export interface InputOptions {
    /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
    required?: boolean;
}