# `@actions/core`

> Core functions for setting results, logging, registering secrets and exporting variables across actions

## Usage

```
// Logging functions
export function debug(message: string): void
export function warning(message: string): void
export function error(message: string): void

/**
 * sets env variable for this action and future actions in the job
 *
 * @param name      the name of the variable to set
 * @param val       the value of the variable
 * @param options   optional. See ExportOptions.
 */
export function exportVariable(name: string, val: string): void

/**
 * Interface for getInput options
 */
export interface InputOptions {
    /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
    required?: bool;
}

/**
 * Gets the value of an input.  The value is also trimmed.
 * 
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
export function getInput(name: string, options?: InputOptions): string | undefined

/**
 * sets the status of the action to neutral
 * @param message 
 */
export function setNeutral(message: string): void

/**
 * sets the status of the action to failed
 * @param message 
 */
export function setFailed(message: string): void
```
