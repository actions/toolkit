import im = require('./interfaces');
import intm = require('./internal');
import process = require('process');

/**
 * sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function exportVariable(name: string, val: string, options?:im.ExportOptions) {
    process.env[name] = val;
    let props = {'name': name, 'isSecret': options? options.isSecret : false};
    intm._issueCommand('set-variable', props, val);
}

/**
 * registers a secret which will get masked from logs
 * @param val value of the secret
 */
export function setSecret(val: string) {
    intm._issueCommand('set-secret', {}, val);
} 

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------

/**
 * Sets the action status to neutral
 */
export function setNeutral() {
    process.exitCode = im.ExitCode.Neutral;
}

/**
 * Sets the action status to failed.  
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
export function setFailed(message: string) {
    process.exitCode = im.ExitCode.Failure;
    error(message);
}

//-----------------------------------------------------------------------
// Logging Commands
//
// error and warning issues do not take FileDetails because while possible,
// that's typically reserved for the agent and the problem matchers.
//
//-----------------------------------------------------------------------

/**
 * Writes debug message to user log
 * @param message debug message
 */
export function debug(message: string) {
    intm._issueCommand('debug', {}, message);
}

/**
 * Adds an error issue
 * @param message error issue message
 */
export function error(message: string) {
    intm._issue('error', message);
}

/**
 * Adds an warning issue
 * @param message warning issue message
 */
export function warning(message: string) {
    intm._issue('warning', message);
}
