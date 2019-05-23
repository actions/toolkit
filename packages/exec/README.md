# `@actions/exec`

> Functions necessary for running tools on the command line

## Usage

```
/**
* Exec a command.
* Output will be streamed to the live console.
* Returns promise with return code
* 
* @param     commandLine        command to execute
* @param     args               optional additional arguments
* @param     options            optional exec options.  See IExecOptions
* @returns   Promise<number>    return code
*/
export function exec(commandLine: string, args?: string[], options?: IExecOptions): Promise<number> 
```
