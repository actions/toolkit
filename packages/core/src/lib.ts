import im = require('./interfaces');
import intm = require('./internal');
import process = require('process');

/**
 * Interface for exportVariable options
 */
export interface ExportOptions {
    /** Optional. Whether the variable should be marked as secret (will be masked from logs). Defaults to false */
    isSecret?: boolean;
}

/**
 * sets env variable for this action and future actions in the job
 *
 * @param name      the name of the variable to set
 * @param val       the value of the variable
 * @param options   optional. See ExportOptions.
 */
export function exportVariable(name: string, val: string, options?: ExportOptions): void {
    if (options && options.isSecret) {
        intm._issueCommand('set-secret', {'name': name}, val);
    }
    process.env[name] = val;
    intm._issueCommand('set-variable', {'name': name}, val);
}

/**
 * Interface for getInput options
 */
export interface InputOptions {
    /** Optional. Whether the input is required. If required and not present, will throw. Defaults to false */
    required?: boolean;
}

/**
 * Gets the value of an input.  The value is also trimmed.
 * 
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
export function getInput(name: string, options?: InputOptions): string | undefined {
    // TODO - how are we passing in actions inputs?
    return '';
}

/**
 * fail the action
 * @param message 
 */
export function setFailure(message: string): void {
    process.exitCode = im.ExitCode.Failure;
    error(message);
}

//-----------------------------------------------------------------------
// Logging Commands
// https://github.com/github/dreamlifter/blob/master/docs/actions-model.md#logging-commands
//
//-----------------------------------------------------------------------

export function error(message: string) {
    intm._issue('error', message);
}

export function warning(message: string) {
    intm._issue('warning', message);
}

export function debug(message: string): void {
    intm._issue('debug', message);
}