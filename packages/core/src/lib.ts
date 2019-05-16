import im = require('./interfaces');
import intm = require('./internal');
import process = require('process');

/**
 * sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
export function setVariable(name: string, val: string) {
    process.env[name] = val;
    intm._issueCommand('set-variable', {'name': name}, val);
}

/**
 * sets a variable which will get masked from logs
 * @param name name of the secret variable 
 * @param val value of the secret variable
 */
export function setSecret(name: string, val: string) {
    intm._issueCommand('set-secret', {'name': name}, val);
    setVariable(name, val);
} 

//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * fail the action
 * @param message 
 */
export function fail(message: string) {
    process.exitCode = im.ExitCode.Failure;
    error(message);
}

//-----------------------------------------------------------------------
// Logging Commands
// https://github.com/github/dreamlifter/blob/master/docs/actions-model.md#logging-commands
//
// error and warning issues do not take FileDetails because while possible,
// that's typically reserved for the agent and the problem matchers.
//
//-----------------------------------------------------------------------

export function addPath(path: string) {
    intm._issueCommand('add-path', {}, path);
}

export function error(message: string) {
    intm._issue('error', message);
}

export function warning(message: string) {
    intm._issue('warning', message);
}