# `@actions/exec`

> Functions necessary for running tools on the command line

## Usage

```
/**
* Exec a command.
* Output will be streamed to the live console.
* Returns promise with return code
* 
* @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
* @param     args               optional arguments for tool. Escaping is handled by the lib.
* @param     options            optional exec options.  See ExecOptions
* @returns   Promise<number>    exit code
*/
export function exec(commandLine: string, args?: string[], options?: ExecOptions): Promise<number> 
```
