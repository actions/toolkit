# `@actions/core`

> Core functions for setting results, logging, registering secrets and exporting variables across actions

## Usage

```
//-----------------------------------------------------------------------
// Variables, Inputs and Outputs
//-----------------------------------------------------------------------

/**
 * sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function exportVariable(name: string, val: string);

/**
 * registers a secret which will get masked from logs
 * @param val value of the secret
 */
export function setSecret(name: string, val: string);

// TODO: follow up and see if we need anything for outputs

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------

/**
 * Sets the action status to neutral
 */
export function setNeutral();

/**
 * Sets the action status to failed.  
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export function setFailed(message: string);

//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------

/**
 * Writes debug message to user log
 * @param message debug message
 */
export function debug(message: string);

/**
 * Adds an error issue
 * @param message error issue message
 */
export function error(message: string);

/**
 * Adds an warning issue
 * @param message warning issue message
 */
export function warning(message: string);
```
