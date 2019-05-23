import * as os from 'os'
import * as events from 'events'
import * as child from 'child_process'
import * as stream from 'stream'
import * as im from './interfaces'

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable prefer-rest-params */

const IS_WINDOWS = process.platform === 'win32'

export class ToolRunner extends events.EventEmitter {
  constructor(toolPath: string, args?: string[], options?: im.IExecOptions) {
    super()

    if (!toolPath) {
      throw new Error("Parameter 'toolPath' cannot be null or empty.")
    }

    this.toolPath = toolPath
    this.args = args || []
    this.options = options || {}
  }

  private toolPath: string
  private args: string[]
  private options: im.IExecOptions

  private _debug(message: string): void {
    if (this.options.listeners && this.options.listeners.debug) {
      this.options.listeners.debug(message)
    }
  }

  private _getCommandString(
    options: im.IExecOptions,
    noPrefix?: boolean
  ): string {
    const toolPath: string = this._getSpawnFileName()
    const args: string[] = this._getSpawnArgs(options)
    let cmd = noPrefix ? '' : '[command]' // omit prefix when piped to a second tool
    if (IS_WINDOWS) {
      // Windows + cmd file
      if (this._isCmdFile()) {
        cmd += toolPath
        for (const a of args) {
          cmd += ` ${a}`
        }
      }
      // Windows + verbatim
      else if (options.windowsVerbatimArguments) {
        cmd += `"${toolPath}"`
        for (const a of args) {
          cmd += ` ${a}`
        }
      }
      // Windows (regular)
      else {
        cmd += this._windowsQuoteCmdArg(toolPath)
        for (const a of args) {
          cmd += ` ${this._windowsQuoteCmdArg(a)}`
        }
      }
    } else {
      // OSX/Linux - this can likely be improved with some form of quoting.
      // creating processes on Unix is fundamentally different than Windows.
      // on Unix, execvp() takes an arg array.
      cmd += toolPath
      for (const a of args) {
        cmd += ` ${a}`
      }
    }

    return cmd
  }

  private _processLineBuffer(
    data: Buffer,
    strBuffer: string,
    onLine: (line: string) => void
  ): void {
    try {
      let s = strBuffer + data.toString()
      let n = s.indexOf(os.EOL)

      while (n > -1) {
        const line = s.substring(0, n)
        onLine(line)

        // the rest of the string ...
        s = s.substring(n + os.EOL.length)
        n = s.indexOf(os.EOL)
      }

      strBuffer = s
    } catch (err) {
      // streaming lines to console is best effort.  Don't fail a build.
      this._debug('error processing line')
    }
  }

  private _getSpawnFileName(): string {
    if (IS_WINDOWS) {
      if (this._isCmdFile()) {
        return process.env['COMSPEC'] || 'cmd.exe'
      }
    }

    return this.toolPath
  }

  private _getSpawnArgs(options: im.IExecOptions): string[] {
    if (IS_WINDOWS) {
      if (this._isCmdFile()) {
        let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`
        for (const a of this.args) {
          argline += ' '
          argline += options.windowsVerbatimArguments
            ? a
            : this._windowsQuoteCmdArg(a)
        }

        argline += '"'
        return [argline]
      }

      if (options.windowsVerbatimArguments) {
        // note, in Node 6.x options.argv0 can be used instead of overriding args.slice and args.unshift.
        // for more details, refer to https://github.com/nodejs/node/blob/v6.x/lib/child_process.js

        const args = this.args.slice(0) // copy the array

        // override slice to prevent Node from creating a copy of the arg array.
        // we need Node to use the "unshift" override below.
        args.slice = function() {
          if (arguments.length !== 1 || arguments[0] !== 0) {
            throw new Error(
              'Unexpected arguments passed to args.slice when windowsVerbatimArguments flag is set.'
            )
          }

          return args
        }

        // override unshift
        //
        // when using the windowsVerbatimArguments option, Node does not quote the tool path when building
        // the cmdline parameter for the win32 function CreateProcess(). an unquoted space in the tool path
        // causes problems for tools when attempting to parse their own command line args. tools typically
        // assume their arguments begin after arg 0.
        //
        // by hijacking unshift, we can quote the tool path when it pushed onto the args array. Node builds
        // the cmdline parameter from the args array.
        //
        // note, we can't simply pass a quoted tool path to Node for multiple reasons:
        //   1) Node verifies the file exists (calls win32 function GetFileAttributesW) and the check returns
        //      false if the path is quoted.
        //   2) Node passes the tool path as the application parameter to CreateProcess, which expects the
        //      path to be unquoted.
        //
        // also note, in addition to the tool path being embedded within the cmdline parameter, Node also
        // passes the tool path to CreateProcess via the application parameter (optional parameter). when
        // present, Windows uses the application parameter to determine which file to run, instead of
        // interpreting the file from the cmdline parameter.
        args.unshift = function() {
          if (arguments.length !== 1) {
            throw new Error(
              'Unexpected arguments passed to args.unshift when windowsVerbatimArguments flag is set.'
            )
          }

          return Array.prototype.unshift.call(args, `"${arguments[0]}"`) // quote the file name
        }
        return args
      }
    }

    return this.args
  }

  private _endsWith(str: string, end: string): boolean {
    return str.endsWith(end)
  }

  private _isCmdFile(): boolean {
    const upperToolPath: string = this.toolPath.toUpperCase()
    return (
      this._endsWith(upperToolPath, '.CMD') ||
      this._endsWith(upperToolPath, '.BAT')
    )
  }

  private _windowsQuoteCmdArg(arg: string): string {
    // for .exe, apply the normal quoting rules that libuv applies
    if (!this._isCmdFile()) {
      return this._uvQuoteCmdArg(arg)
    }

    // otherwise apply quoting rules specific to the cmd.exe command line parser.
    // the libuv rules are generic and are not designed specifically for cmd.exe
    // command line parser.
    //
    // for a detailed description of the cmd.exe command line parser, refer to
    // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912

    // need quotes for empty arg
    if (!arg) {
      return '""'
    }

    // determine whether the arg needs to be quoted
    const cmdSpecialChars = [
      ' ',
      '\t',
      '&',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
      '^',
      '=',
      ';',
      '!',
      "'",
      '+',
      ',',
      '`',
      '~',
      '|',
      '<',
      '>',
      '"'
    ]
    let needsQuotes = false
    for (const char of arg) {
      if (cmdSpecialChars.some(x => x === char)) {
        needsQuotes = true
        break
      }
    }

    // short-circuit if quotes not needed
    if (!needsQuotes) {
      return arg
    }

    // the following quoting rules are very similar to the rules that by libuv applies.
    //
    // 1) wrap the string in quotes
    //
    // 2) double-up quotes - i.e. " => ""
    //
    //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
    //    doesn't work well with a cmd.exe command line.
    //
    //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
    //    for example, the command line:
    //          foo.exe "myarg:""my val"""
    //    is parsed by a .NET console app into an arg array:
    //          [ "myarg:\"my val\"" ]
    //    which is the same end result when applying libuv quoting rules. although the actual
    //    command line from libuv quoting rules would look like:
    //          foo.exe "myarg:\"my val\""
    //
    // 3) double-up slashes that preceed a quote,
    //    e.g.  hello \world    => "hello \world"
    //          hello\"world    => "hello\\""world"
    //          hello\\"world   => "hello\\\\""world"
    //          hello world\    => "hello world\\"
    //
    //    technically this is not required for a cmd.exe command line, or the batch argument parser.
    //    the reasons for including this as a .cmd quoting rule are:
    //
    //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
    //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
    //
    //    b) it's what we've been doing previously (by deferring to node default behavior) and we
    //       haven't heard any complaints about that aspect.
    //
    // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
    // escaped when used on the command line directly - even though within a .cmd file % can be escaped
    // by using %%.
    //
    // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
    // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
    //
    // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
    // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
    // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
    // to an external program.
    //
    // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
    // % can be escaped within a .cmd file.
    let reverse = '"'
    let quoteHit = true
    for (let i = arg.length; i > 0; i--) {
      // walk the string in reverse
      reverse += arg[i - 1]
      if (quoteHit && arg[i - 1] === '\\') {
        reverse += '\\' // double the slash
      } else if (arg[i - 1] === '"') {
        quoteHit = true
        reverse += '"' // double the quote
      } else {
        quoteHit = false
      }
    }

    reverse += '"'
    return reverse
      .split('')
      .reverse()
      .join('')
  }

  private _uvQuoteCmdArg(arg: string): string {
    // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
    // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
    // is used.
    //
    // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
    // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
    // pasting copyright notice from Node within this function:
    //
    //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
    //
    //      Permission is hereby granted, free of charge, to any person obtaining a copy
    //      of this software and associated documentation files (the "Software"), to
    //      deal in the Software without restriction, including without limitation the
    //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    //      sell copies of the Software, and to permit persons to whom the Software is
    //      furnished to do so, subject to the following conditions:
    //
    //      The above copyright notice and this permission notice shall be included in
    //      all copies or substantial portions of the Software.
    //
    //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    //      IN THE SOFTWARE.

    if (!arg) {
      // Need double quotation for empty argument
      return '""'
    }

    if (!arg.includes(' ') && !arg.includes('\t') && !arg.includes('"')) {
      // No quotation needed
      return arg
    }

    if (!arg.includes('"') && !arg.includes('\\')) {
      // No embedded double quotes or backslashes, so I can just wrap
      // quote marks around the whole thing.
      return `"${arg}"`
    }

    // Expected input/output:
    //   input : hello"world
    //   output: "hello\"world"
    //   input : hello""world
    //   output: "hello\"\"world"
    //   input : hello\world
    //   output: hello\world
    //   input : hello\\world
    //   output: hello\\world
    //   input : hello\"world
    //   output: "hello\\\"world"
    //   input : hello\\"world
    //   output: "hello\\\\\"world"
    //   input : hello world\
    //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
    //                             but it appears the comment is wrong, it should be "hello world\\"
    let reverse = '"'
    let quoteHit = true
    for (let i = arg.length; i > 0; i--) {
      // walk the string in reverse
      reverse += arg[i - 1]
      if (quoteHit && arg[i - 1] === '\\') {
        reverse += '\\'
      } else if (arg[i - 1] === '"') {
        quoteHit = true
        reverse += '\\'
      } else {
        quoteHit = false
      }
    }

    reverse += '"'
    return reverse
      .split('')
      .reverse()
      .join('')
  }

  private _cloneExecOptions(options?: im.IExecOptions): im.IExecOptions {
    options = options || <im.IExecOptions>{}
    const result: im.IExecOptions = <im.IExecOptions>{
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      silent: options.silent || false,
      windowsVerbatimArguments: options.windowsVerbatimArguments || false,
      failOnStdErr: options.failOnStdErr || false,
      ignoreReturnCode: options.ignoreReturnCode || false,
      delay: options.delay || 10000
    }
    result.outStream = options.outStream || <stream.Writable>process.stdout
    result.errStream = options.errStream || <stream.Writable>process.stderr
    return result
  }

  private _getSpawnOptions(options?: im.IExecOptions): child.SpawnOptions {
    options = options || <im.IExecOptions>{}
    const result = <child.SpawnOptions>{}
    result.cwd = options.cwd
    result.env = options.env
    result['windowsVerbatimArguments'] =
      options.windowsVerbatimArguments || this._isCmdFile()
    return result
  }

  /**
   * Exec a tool.
   * Output will be streamed to the live console.
   * Returns promise with return code
   *
   * @param     tool     path to tool to exec
   * @param     options  optional exec options.  See IExecOptions
   * @returns   number
   */
  async exec(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this._debug(`exec tool: ${this.toolPath}`)
      this._debug('arguments:')
      for (const arg of this.args) {
        this._debug(`   ${arg}`)
      }

      const optionsNonNull = this._cloneExecOptions(this.options)
      if (!optionsNonNull.silent && optionsNonNull.outStream) {
        optionsNonNull.outStream.write(
          this._getCommandString(optionsNonNull) + os.EOL
        )
      }

      const state = new ExecState(optionsNonNull, this.toolPath)
      state.on('debug', (message: string) => {
        this._debug(message)
      })

      const cp = child.spawn(
        this._getSpawnFileName(),
        this._getSpawnArgs(optionsNonNull),
        this._getSpawnOptions(this.options)
      )

      const stdbuffer = ''
      if (cp.stdout) {
        cp.stdout.on('data', (data: Buffer) => {
          if (this.options.listeners && this.options.listeners.stdout) {
            this.options.listeners.stdout(data)
          }

          if (!optionsNonNull.silent && optionsNonNull.outStream) {
            optionsNonNull.outStream.write(data)
          }

          this._processLineBuffer(data, stdbuffer, (line: string) => {
            if (this.options.listeners && this.options.listeners.stdline) {
              this.options.listeners.stdline(line)
            }
          })
        })
      }

      const errbuffer = ''
      if (cp.stderr) {
        cp.stderr.on('data', (data: Buffer) => {
          state.processStderr = true
          if (this.options.listeners && this.options.listeners.stderr) {
            this.options.listeners.stderr(data)
          }

          if (
            !optionsNonNull.silent &&
            optionsNonNull.errStream &&
            optionsNonNull.outStream
          ) {
            const s = optionsNonNull.failOnStdErr
              ? optionsNonNull.errStream
              : optionsNonNull.outStream
            s.write(data)
          }

          this._processLineBuffer(data, errbuffer, (line: string) => {
            if (this.options.listeners && this.options.listeners.errline) {
              this.options.listeners.errline(line)
            }
          })
        })
      }

      cp.on('error', (err: Error) => {
        state.processError = err.message
        state.processExited = true
        state.processClosed = true
        state.CheckComplete()
      })

      cp.on('exit', (code: number) => {
        state.processExitCode = code
        state.processExited = true
        this._debug(`Exit code ${code} received from tool '${this.toolPath}'`)
        state.CheckComplete()
      })

      cp.on('close', (code: number) => {
        state.processExitCode = code
        state.processExited = true
        state.processClosed = true
        this._debug(`STDIO streams have closed for tool '${this.toolPath}'`)
        state.CheckComplete()
      })

      state.on('done', (error: Error, exitCode: number) => {
        if (stdbuffer.length > 0) {
          this.emit('stdline', stdbuffer)
        }

        if (errbuffer.length > 0) {
          this.emit('errline', errbuffer)
        }

        cp.removeAllListeners()

        if (error) {
          reject(error)
        } else {
          resolve(exitCode)
        }
      })
    })
  }
}

/**
 * Convert an arg string to an array of args. Handles escaping
 *
 * @param    argString   string of arguments
 * @returns  string[]    array of arguments
 */
export function argStringToArray(argString: string): string[] {
  const args: string[] = []

  let inQuotes = false
  let escaped = false
  let arg = ''

  function append(c: string): void {
    // we only escape double quotes.
    if (escaped && c !== '"') {
      arg += '\\'
    }

    arg += c
    escaped = false
  }

  for (let i = 0; i < argString.length; i++) {
    const c = argString.charAt(i)

    if (c === '"') {
      if (!escaped) {
        inQuotes = !inQuotes
      } else {
        append(c)
      }
      continue
    }

    if (c === '\\' && escaped) {
      append(c)
      continue
    }

    if (c === '\\' && inQuotes) {
      escaped = true
      continue
    }

    if (c === ' ' && !inQuotes) {
      if (arg.length > 0) {
        args.push(arg)
        arg = ''
      }
      continue
    }

    append(c)
  }

  if (arg.length > 0) {
    args.push(arg.trim())
  }

  return args
}

class ExecState extends events.EventEmitter {
  constructor(options: im.IExecOptions, toolPath: string) {
    super()

    if (!toolPath) {
      throw new Error('toolPath must not be empty')
    }

    this.options = options
    this.toolPath = toolPath
    if (options.delay) {
      this.delay = options.delay
    }
  }

  processClosed: boolean = false // tracks whether the process has exited and stdio is closed
  processError: string = ''
  processExitCode: number = 0
  processExited: boolean = false // tracks whether the process has exited
  processStderr: boolean = false // tracks whether stderr was written to
  private delay = 10000 // 10 seconds
  private done: boolean = false
  private options: im.IExecOptions
  private timeout: NodeJS.Timer | null = null
  private toolPath: string

  CheckComplete(): void {
    if (this.done) {
      return
    }

    if (this.processClosed) {
      this._setResult()
    } else if (this.processExited) {
      this.timeout = setTimeout(ExecState.HandleTimeout, this.delay, this)
    }
  }

  private _debug(message: string): void {
    this.emit('debug', message)
  }

  private _setResult(): void {
    // determine whether there is an error
    let error: Error | undefined
    if (this.processExited) {
      if (this.processError) {
        error = new Error(
          `There was an error when attempting to execute the process '${
            this.toolPath
          }'. This may indicate the process failed to start. Error: ${
            this.processError
          }`
        )
      } else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
        error = new Error(
          `The process '${this.toolPath}' failed with exit code ${
            this.processExitCode
          }`
        )
      } else if (this.processStderr && this.options.failOnStdErr) {
        error = new Error(
          `The process '${
            this.toolPath
          }' failed because one or more lines were written to the STDERR stream`
        )
      }
    }

    // clear the timeout
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    this.done = true
    this.emit('done', error, this.processExitCode)
  }

  private static HandleTimeout(state: ExecState): void {
    if (state.done) {
      return
    }

    if (!state.processClosed && state.processExited) {
      const message = `The STDIO streams did not close within ${state.delay /
        1000} seconds of the exit event from process '${
        state.toolPath
      }'. This may indicate a child process inherited the STDIO streams and has not yet exited.`
      state._debug(message)
    }

    state._setResult()
  }
}
