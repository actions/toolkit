import * as exec from '../src/exec'
import * as im from '../src/interfaces'

import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as stream from 'stream'
import * as io from '@actions/io'

/* eslint-disable @typescript-eslint/unbound-method */

const IS_WINDOWS = process.platform === 'win32'

let outstream: stream.Writable
let errstream: stream.Writable

describe('@actions/exec', () => {
  beforeAll(() => {
    io.mkdirP(getTestTemp())
    outstream = fs.createWriteStream(path.join(getTestTemp(), 'my.log'))
    errstream = fs.createWriteStream(path.join(getTestTemp(), 'myerr.log'))
  })

  beforeEach(() => {
    outstream.write = jest.fn()
    errstream.write = jest.fn()
  })

  it('Runs exec successfully with arguments split out', async () => {
    const _testExecOptions = getExecOptions()

    let exitCode = 1
    let toolpath = ''
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      exitCode = await exec.exec(
        `"${toolpath}"`,
        ['/c', 'echo', 'hello'],
        _testExecOptions
      )
    } else {
      toolpath = await io.which('ls', true)
      exitCode = await exec.exec(
        `"${toolpath}"`,
        ['-l', '-a'],
        _testExecOptions
      )
    }

    expect(exitCode).toBe(0)
    if (IS_WINDOWS) {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} /c echo hello${os.EOL}`
      )
      expect(outstream.write).toBeCalledWith(Buffer.from(`hello${os.EOL}`))
    } else {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} -l -a${os.EOL}`
      )
    }
  })

  it('Runs exec successfully with arguments partially split out', async () => {
    const _testExecOptions = getExecOptions()

    let exitCode = 1
    let toolpath = ''
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      exitCode = await exec.exec(
        `"${toolpath}" /c`,
        ['echo', 'hello'],
        _testExecOptions
      )
    } else {
      toolpath = await io.which('ls', true)
      exitCode = await exec.exec(`"${toolpath}" -l`, ['-a'], _testExecOptions)
    }

    expect(exitCode).toBe(0)
    if (IS_WINDOWS) {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} /c echo hello${os.EOL}`
      )
      expect(outstream.write).toBeCalledWith(Buffer.from(`hello${os.EOL}`))
    } else {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} -l -a${os.EOL}`
      )
    }
  })

  it('Runs exec successfully with arguments as part of command line', async () => {
    const _testExecOptions = getExecOptions()

    let exitCode = 1
    let toolpath = ''
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      exitCode = await exec.exec(
        `"${toolpath}" /c echo hello`,
        [],
        _testExecOptions
      )
    } else {
      toolpath = await io.which('ls', true)
      exitCode = await exec.exec(`"${toolpath}" -l -a`, [], _testExecOptions)
    }

    expect(exitCode).toBe(0)
    if (IS_WINDOWS) {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} /c echo hello${os.EOL}`
      )
      expect(outstream.write).toBeCalledWith(Buffer.from(`hello${os.EOL}`))
    } else {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} -l -a${os.EOL}`
      )
    }
  })

  it('Runs exec successfully with command from PATH', async () => {
    const execOptions = getExecOptions()
    const outStream = new StringStream()
    execOptions.outStream = outStream
    let output = ''
    execOptions.listeners = {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }

    let exitCode = 1
    let tool: string
    let args: string[]
    if (IS_WINDOWS) {
      tool = 'cmd'
      args = ['/c', 'echo', 'hello']
    } else {
      tool = 'sh'
      args = ['-c', 'echo hello']
    }

    exitCode = await exec.exec(tool, args, execOptions)

    expect(exitCode).toBe(0)
    const rootedTool = await io.which(tool, true)
    expect(outStream.getContents().split(os.EOL)[0]).toBe(
      `[command]${rootedTool} ${args.join(' ')}`
    )
    expect(output.trim()).toBe(`hello`)
  })

  it('Exec fails with error on bad call', async () => {
    const _testExecOptions = getExecOptions()

    let toolpath = ''
    let args: string[] = []
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      args = ['/c', 'non-existent']
    } else {
      toolpath = await io.which('ls', true)
      args = ['-l', 'non-existent']
    }

    let failed = false

    await exec.exec(`"${toolpath}"`, args, _testExecOptions).catch(err => {
      failed = true
      expect(err.message).toContain(
        `The process '${toolpath}' failed with exit code `
      )
    })

    expect(failed).toBe(true)
    if (IS_WINDOWS) {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} /c non-existent${os.EOL}`
      )
    } else {
      expect(outstream.write).toBeCalledWith(
        `[command]${toolpath} -l non-existent${os.EOL}`
      )
    }
  })

  it('Succeeds on stderr by default', async () => {
    const scriptPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const nodePath: string = await io.which('node', true)

    const _testExecOptions = getExecOptions()

    const exitCode = await exec.exec(
      `"${nodePath}"`,
      [scriptPath],
      _testExecOptions
    )

    expect(exitCode).toBe(0)
    expect(outstream.write).toBeCalledWith(
      Buffer.from('this is output to stderr')
    )
  })

  it('Fails on stderr if specified', async () => {
    const scriptPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const nodePath: string = await io.which('node', true)

    const _testExecOptions = getExecOptions()
    _testExecOptions.failOnStdErr = true

    let failed = false
    await exec
      .exec(`"${nodePath}"`, [scriptPath], _testExecOptions)
      .catch(() => {
        failed = true
      })

    expect(failed).toBe(true)
    expect(errstream.write).toBeCalledWith(
      Buffer.from('this is output to stderr')
    )
  })

  it('Fails when process fails to launch', async () => {
    const nodePath: string = await io.which('node', true)
    const _testExecOptions = getExecOptions()
    _testExecOptions.cwd = path.join(__dirname, 'nosuchdir')

    let failed = false
    await exec.exec(`"${nodePath}"`, [], _testExecOptions).catch(() => {
      failed = true
    })

    expect(failed).toBe(true)
  })

  it('Handles output callbacks', async () => {
    const stdErrPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const stdOutPath: string = path.join(
      __dirname,
      'scripts',
      'stdoutoutput.js'
    )
    const nodePath: string = await io.which('node', true)
    let stdoutCalled = false
    let stderrCalled = false

    const _testExecOptions = getExecOptions()
    _testExecOptions.listeners = {
      stdout: (data: Buffer) => {
        expect(data).toEqual(Buffer.from('this is output to stdout'))
        stdoutCalled = true
      },
      stderr: (data: Buffer) => {
        expect(data).toEqual(Buffer.from('this is output to stderr'))
        stderrCalled = true
      }
    }

    let exitCode = await exec.exec(
      `"${nodePath}"`,
      [stdOutPath],
      _testExecOptions
    )
    expect(exitCode).toBe(0)
    exitCode = await exec.exec(`"${nodePath}"`, [stdErrPath], _testExecOptions)
    expect(exitCode).toBe(0)

    expect(stdoutCalled).toBeTruthy()
    expect(stderrCalled).toBeTruthy()
  })

  it('Handles large stdline', async () => {
    const stdlinePath: string = path.join(
      __dirname,
      'scripts',
      'stdlineoutput.js'
    )
    const nodePath: string = await io.which('node', true)

    const _testExecOptions = getExecOptions()
    let largeLine = ''
    _testExecOptions.listeners = {
      stdline: (line: string) => {
        largeLine = line
      }
    }

    const exitCode = await exec.exec(
      `"${nodePath}"`,
      [stdlinePath],
      _testExecOptions
    )
    expect(exitCode).toBe(0)
    expect(Buffer.byteLength(largeLine)).toEqual(2 ** 16 + 1)
  })

  it('Handles stdin shell', async () => {
    let command: string
    if (IS_WINDOWS) {
      command = 'wait-for-input.cmd'
    } else {
      command = 'wait-for-input.sh'
    }

    const waitForInput: string = path.join(__dirname, 'scripts', command)

    const _testExecOptions = getExecOptions()

    _testExecOptions.listeners = {
      stdout: (data: Buffer) => {
        expect(data).toEqual(Buffer.from(`this is my input${os.EOL}`))
      }
    }

    _testExecOptions.input = Buffer.from('this is my input')

    const exitCode = await exec.exec(`"${waitForInput}"`, [], _testExecOptions)
    expect(exitCode).toBe(0)
  })

  it('Handles stdin js', async () => {
    const waitForInput: string = path.join(
      __dirname,
      'scripts',
      'wait-for-input.js'
    )

    const _testExecOptions = getExecOptions()

    _testExecOptions.listeners = {
      stdout: (data: Buffer) => {
        expect(data).toEqual(Buffer.from(`this is my input`))
      }
    }

    _testExecOptions.input = Buffer.from('this is my input')

    const nodePath = await io.which('node', true)
    const exitCode = await exec.exec(nodePath, [waitForInput], _testExecOptions)
    expect(exitCode).toBe(0)
  })

  it('Handles child process holding streams open', async function() {
    const semaphorePath = path.join(
      getTestTemp(),
      'child-process-semaphore.txt'
    )
    fs.writeFileSync(semaphorePath, '')

    const nodePath = await io.which('node', true)
    const scriptPath = path.join(__dirname, 'scripts', 'wait-for-file.js')
    const debugList: string[] = []
    const _testExecOptions = getExecOptions()
    _testExecOptions.delay = 500
    _testExecOptions.windowsVerbatimArguments = true
    _testExecOptions.listeners = {
      debug: (data: string) => {
        debugList.push(data)
      }
    }

    let exitCode: number
    if (IS_WINDOWS) {
      const toolName: string = await io.which('cmd.exe', true)
      const args = [
        '/D', // Disable execution of AutoRun commands from registry.
        '/E:ON', // Enable command extensions. Note, command extensions are enabled by default, unless disabled via registry.
        '/V:OFF', // Disable delayed environment expansion. Note, delayed environment expansion is disabled by default, unless enabled via registry.
        '/S', // Will cause first and last quote after /C to be stripped.
        '/C',
        `"start "" /B "${nodePath}" "${scriptPath}" "file=${semaphorePath}""`
      ]
      exitCode = await exec.exec(`"${toolName}"`, args, _testExecOptions)
    } else {
      const toolName: string = await io.which('bash', true)
      const args = ['-c', `node '${scriptPath}' 'file=${semaphorePath}' &`]

      exitCode = await exec.exec(`"${toolName}"`, args, _testExecOptions)
    }

    expect(exitCode).toBe(0)
    expect(
      debugList.filter(x => x.includes('STDIO streams did not close')).length
    ).toBe(1)

    fs.unlinkSync(semaphorePath)
  }, 10000) // this was timing out on some slower hosted macOS runs at default 5s

  it('Handles child process holding streams open and non-zero exit code', async function() {
    const semaphorePath = path.join(
      getTestTemp(),
      'child-process-semaphore.txt'
    )
    fs.writeFileSync(semaphorePath, '')

    const nodePath = await io.which('node', true)
    const scriptPath = path.join(__dirname, 'scripts', 'wait-for-file.js')
    const debugList: string[] = []
    const _testExecOptions = getExecOptions()
    _testExecOptions.delay = 500
    _testExecOptions.windowsVerbatimArguments = true
    _testExecOptions.listeners = {
      debug: (data: string) => {
        debugList.push(data)
      }
    }

    let toolName: string
    let args: string[]
    if (IS_WINDOWS) {
      toolName = await io.which('cmd.exe', true)
      args = [
        '/D', // Disable execution of AutoRun commands from registry.
        '/E:ON', // Enable command extensions. Note, command extensions are enabled by default, unless disabled via registry.
        '/V:OFF', // Disable delayed environment expansion. Note, delayed environment expansion is disabled by default, unless enabled via registry.
        '/S', // Will cause first and last quote after /C to be stripped.
        '/C',
        `"start "" /B "${nodePath}" "${scriptPath}" "file=${semaphorePath}"" & exit /b 123`
      ]
    } else {
      toolName = await io.which('bash', true)
      args = ['-c', `node '${scriptPath}' 'file=${semaphorePath}' & exit 123`]
    }

    await exec
      .exec(`"${toolName}"`, args, _testExecOptions)
      .then(() => {
        throw new Error('Should not have succeeded')
      })
      .catch(err => {
        expect(
          err.message.indexOf('failed with exit code 123')
        ).toBeGreaterThanOrEqual(0)
      })

    expect(
      debugList.filter(x => x.includes('STDIO streams did not close')).length
    ).toBe(1)

    fs.unlinkSync(semaphorePath)
  }, 10000) // this was timing out on some slower hosted macOS runs at default 5s

  it('Handles child process holding streams open and stderr', async function() {
    const semaphorePath = path.join(
      getTestTemp(),
      'child-process-semaphore.txt'
    )
    fs.writeFileSync(semaphorePath, '')

    const nodePath = await io.which('node', true)
    const scriptPath = path.join(__dirname, 'scripts', 'wait-for-file.js')
    const debugList: string[] = []
    const _testExecOptions = getExecOptions()
    _testExecOptions.delay = 500
    _testExecOptions.failOnStdErr = true
    _testExecOptions.windowsVerbatimArguments = true
    _testExecOptions.listeners = {
      debug: (data: string) => {
        debugList.push(data)
      }
    }

    let toolName: string
    let args: string[]
    if (IS_WINDOWS) {
      toolName = await io.which('cmd.exe', true)
      args = [
        '/D', // Disable execution of AutoRun commands from registry.
        '/E:ON', // Enable command extensions. Note, command extensions are enabled by default, unless disabled via registry.
        '/V:OFF', // Disable delayed environment expansion. Note, delayed environment expansion is disabled by default, unless enabled via registry.
        '/S', // Will cause first and last quote after /C to be stripped.
        '/C',
        `"start "" /B "${nodePath}" "${scriptPath}" "file=${semaphorePath}"" & echo hi 1>&2`
      ]
    } else {
      toolName = await io.which('bash', true)
      args = [
        '-c',
        `node '${scriptPath}' 'file=${semaphorePath}' & echo hi 1>&2`
      ]
    }

    await exec
      .exec(`"${toolName}"`, args, _testExecOptions)
      .then(() => {
        throw new Error('Should not have succeeded')
      })
      .catch(err => {
        expect(
          err.message.indexOf(
            'failed because one or more lines were written to the STDERR stream'
          )
        ).toBeGreaterThanOrEqual(0)
      })

    expect(
      debugList.filter(x => x.includes('STDIO streams did not close')).length
    ).toBe(1)

    fs.unlinkSync(semaphorePath)
  })

  it('Exec roots relative tool path using unrooted options.cwd', async () => {
    let exitCode: number
    let command: string
    if (IS_WINDOWS) {
      command = './print-args-cmd' // let ToolRunner resolve the extension
    } else {
      command = './print-args-sh.sh'
    }
    const execOptions = getExecOptions()
    execOptions.cwd = 'scripts'
    const outStream = new StringStream()
    execOptions.outStream = outStream
    let output = ''
    execOptions.listeners = {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }

    const originalCwd = process.cwd()
    try {
      process.chdir(__dirname)
      exitCode = await exec.exec(`${command} hello world`, [], execOptions)
    } catch (err) {
      process.chdir(originalCwd)
      throw err
    }

    expect(exitCode).toBe(0)
    const toolPath = path.resolve(
      __dirname,
      execOptions.cwd,
      `${command}${IS_WINDOWS ? '.cmd' : ''}`
    )
    if (IS_WINDOWS) {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C "${toolPath} hello world"`
      )
    } else {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${toolPath} hello world`
      )
    }
    expect(output.trim()).toBe(`args[0]: "hello"${os.EOL}args[1]: "world"`)
  })

  it('Exec roots throws friendly error when bad cwd is specified', async () => {
    const execOptions = getExecOptions()
    execOptions.cwd = 'nonexistent/path'

    await expect(exec.exec('ls', ['-all'], execOptions)).rejects.toThrowError(
      `The cwd: ${execOptions.cwd} does not exist!`
    )
  })

  it('Exec roots does not throw when valid cwd is provided', async () => {
    const execOptions = getExecOptions()
    execOptions.cwd = './'

    await expect(exec.exec('ls', ['-all'], execOptions)).resolves.toBe(0)
  })

  it('Exec roots relative tool path using rooted options.cwd', async () => {
    let command: string
    if (IS_WINDOWS) {
      command = './print-args-cmd' // let ToolRunner resolve the extension
    } else {
      command = './print-args-sh.sh'
    }
    const execOptions = getExecOptions()
    execOptions.cwd = path.join(__dirname, 'scripts')
    const outStream = new StringStream()
    execOptions.outStream = outStream
    let output = ''
    execOptions.listeners = {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }

    const exitCode = await exec.exec(`${command} hello world`, [], execOptions)

    expect(exitCode).toBe(0)
    const toolPath = path.resolve(
      __dirname,
      execOptions.cwd,
      `${command}${IS_WINDOWS ? '.cmd' : ''}`
    )
    if (IS_WINDOWS) {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C "${toolPath} hello world"`
      )
    } else {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${toolPath} hello world`
      )
    }
    expect(output.trim()).toBe(`args[0]: "hello"${os.EOL}args[1]: "world"`)
  })

  it('Exec roots relative tool path using process.cwd', async () => {
    let exitCode: number
    let command: string
    if (IS_WINDOWS) {
      command = 'scripts/print-args-cmd' // let ToolRunner resolve the extension
    } else {
      command = 'scripts/print-args-sh.sh'
    }
    const execOptions = getExecOptions()
    const outStream = new StringStream()
    execOptions.outStream = outStream
    let output = ''
    execOptions.listeners = {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }

    const originalCwd = process.cwd()
    try {
      process.chdir(__dirname)
      exitCode = await exec.exec(`${command} hello world`, [], execOptions)
    } catch (err) {
      process.chdir(originalCwd)
      throw err
    }

    expect(exitCode).toBe(0)
    const toolPath = path.resolve(
      __dirname,
      `${command}${IS_WINDOWS ? '.cmd' : ''}`
    )
    if (IS_WINDOWS) {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C "${toolPath} hello world"`
      )
    } else {
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${toolPath} hello world`
      )
    }
    expect(output.trim()).toBe(`args[0]: "hello"${os.EOL}args[1]: "world"`)
  })

  it('correctly outputs for getExecOutput', async () => {
    const stdErrPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const stdOutPath: string = path.join(
      __dirname,
      'scripts',
      'stdoutoutput.js'
    )
    const nodePath: string = await io.which('node', true)

    const {exitCode: exitCodeOut, stdout} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdOutPath],
      getExecOptions()
    )

    expect(exitCodeOut).toBe(0)
    expect(stdout).toBe('this is output to stdout')

    const {exitCode: exitCodeErr, stderr} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdErrPath],
      getExecOptions()
    )
    expect(exitCodeErr).toBe(0)
    expect(stderr).toBe('this is output to stderr')
  })

  it('correctly outputs for getExecOutput with additional listeners', async () => {
    const stdErrPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const stdOutPath: string = path.join(
      __dirname,
      'scripts',
      'stdoutoutput.js'
    )

    const nodePath: string = await io.which('node', true)
    let listenerOut = ''

    const {exitCode: exitCodeOut, stdout} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdOutPath],
      {
        ...getExecOptions(),
        listeners: {
          stdout: data => {
            listenerOut = data.toString()
          }
        }
      }
    )

    expect(exitCodeOut).toBe(0)
    expect(stdout).toBe('this is output to stdout')
    expect(listenerOut).toBe('this is output to stdout')

    let listenerErr = ''
    const {exitCode: exitCodeErr, stderr} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdErrPath],
      {
        ...getExecOptions(),
        listeners: {
          stderr: data => {
            listenerErr = data.toString()
          }
        }
      }
    )
    expect(exitCodeErr).toBe(0)
    expect(stderr).toBe('this is output to stderr')
    expect(listenerErr).toBe('this is output to stderr')
  })

  it('correctly outputs for getExecOutput when total size exceeds buffer size', async () => {
    const stdErrPath: string = path.join(
      __dirname,
      'scripts',
      'stderroutput.js'
    )
    const stdOutPath: string = path.join(
      __dirname,
      'scripts',
      'stdoutoutputlarge.js'
    )

    const nodePath: string = await io.which('node', true)
    let listenerOut = ''

    const {exitCode: exitCodeOut, stdout} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdOutPath],
      {
        ...getExecOptions(),
        listeners: {
          stdout: data => {
            listenerOut += data.toString()
          }
        }
      }
    )

    expect(exitCodeOut).toBe(0)
    expect(Buffer.byteLength(stdout || '', 'utf8')).toBe(2 ** 25)
    expect(Buffer.byteLength(listenerOut, 'utf8')).toBe(2 ** 25)

    let listenerErr = ''
    const {exitCode: exitCodeErr, stderr} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdErrPath],
      {
        ...getExecOptions(),
        listeners: {
          stderr: data => {
            listenerErr = data.toString()
          }
        }
      }
    )
    expect(exitCodeErr).toBe(0)
    expect(stderr).toBe('this is output to stderr')
    expect(listenerErr).toBe('this is output to stderr')
  })

  it('correctly outputs for getExecOutput with multi-byte characters', async () => {
    const stdOutPath: string = path.join(
      __dirname,
      'scripts',
      'stdoutputspecial.js'
    )

    const nodePath: string = await io.which('node', true)
    let numStdOutBufferCalls = 0
    const {exitCode: exitCodeOut, stdout} = await exec.getExecOutput(
      `"${nodePath}"`,
      [stdOutPath],
      {
        ...getExecOptions(),
        listeners: {
          stdout: () => {
            numStdOutBufferCalls += 1
          }
        }
      }
    )

    expect(exitCodeOut).toBe(0)
    //one call for each half of the © character, ensuring it was actually split and not sent together
    expect(numStdOutBufferCalls).toBe(2)
    expect(stdout).toBe('©')
  })

  if (IS_WINDOWS) {
    it('Exec roots relative tool path using process.cwd (Windows path separator)', async () => {
      let exitCode: number
      const command = 'scripts\\print-args-cmd' // let ToolRunner resolve the extension
      const execOptions = getExecOptions()
      const outStream = new StringStream()
      execOptions.outStream = outStream
      let output = ''
      execOptions.listeners = {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      }

      const originalCwd = process.cwd()
      try {
        process.chdir(__dirname)
        exitCode = await exec.exec(`${command} hello world`, [], execOptions)
      } catch (err) {
        process.chdir(originalCwd)
        throw err
      }

      expect(exitCode).toBe(0)
      const toolPath = path.resolve(__dirname, `${command}.cmd`)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C "${toolPath} hello world"`
      )
      expect(output.trim()).toBe(`args[0]: "hello"${os.EOL}args[1]: "world"`)
    })

    // Win specific quoting tests
    it('execs .exe with verbatim args (Windows)', async () => {
      const exePath = process.env.ComSpec
      const args: string[] = ['/c', 'echo', 'helloworld', 'hello:"world again"']
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        windowsVerbatimArguments: true,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${exePath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]"${exePath}" /c echo helloworld hello:"world again"`
      )
      expect(output.trim()).toBe('helloworld hello:"world again"')
    })

    it('execs .exe with arg quoting (Windows)', async () => {
      const exePath = process.env.ComSpec
      const args: string[] = [
        '/c',
        'echo',
        'helloworld',
        'hello world',
        'hello:"world again"',
        'hello,world'
      ]
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${exePath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${exePath} /c echo` +
          ` helloworld` +
          ` "hello world"` +
          ` "hello:\\"world again\\""` +
          ` hello,world`
      )
      expect(output.trim()).toBe(
        'helloworld' +
          ' "hello world"' +
          ' "hello:\\"world again\\""' +
          ' hello,world'
      )
    })

    it('execs .exe with a space and with verbatim args (Windows)', async () => {
      // this test validates the quoting that tool runner adds around the tool path
      // when using the windowsVerbatimArguments option. otherwise the target process
      // interprets the args as starting after the first space in the tool path.
      const exePath = compileArgsExe('print args exe with spaces.exe')
      const args: string[] = ['myarg1 myarg2']
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        windowsVerbatimArguments: true,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${exePath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]"${exePath}" myarg1 myarg2`
      )
      expect(output.trim()).toBe("args[0]: 'myarg1'\r\nargs[1]: 'myarg2'")
    }, 20000) // slower windows runs timeout, so upping timeout to 20s (from default of 5s)

    it('execs .cmd with a space and with verbatim args (Windows)', async () => {
      // this test validates the quoting that tool runner adds around the script path.
      // otherwise cmd.exe will not be able to resolve the path to the script.
      const cmdPath = path.join(
        __dirname,
        'scripts',
        'print args cmd with spaces.cmd'
      )
      const args: string[] = ['arg1 arg2', 'arg3']
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        windowsVerbatimArguments: true,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${cmdPath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C ""${cmdPath}" arg1 arg2 arg3"`
      )
      expect(output.trim()).toBe(
        'args[0]: "arg1"\r\nargs[1]: "arg2"\r\nargs[2]: "arg3"'
      )
    })

    it('execs .cmd with a space and with arg with space (Windows)', async () => {
      // this test validates the command is wrapped in quotes (i.e. cmd.exe /S /C "<COMMAND>").
      // otherwise the leading quote (around the script with space path) would be stripped
      // and cmd.exe would not be able to resolve the script path.
      const cmdPath = path.join(
        __dirname,
        'scripts',
        'print args cmd with spaces.cmd'
      )
      const args: string[] = ['my arg 1', 'my arg 2']
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${cmdPath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C ""${cmdPath}" "my arg 1" "my arg 2""`
      )
      expect(output.trim()).toBe(
        'args[0]: "<quote>my arg 1<quote>"\r\n' +
          'args[1]: "<quote>my arg 2<quote>"'
      )
    })

    it('execs .cmd from path (Windows)', async () => {
      // this test validates whether a .cmd is resolved from the PATH when the extension is not specified
      const cmd = 'print-args-cmd' // note, not print-args-cmd.cmd
      const cmdPath = path.join(__dirname, 'scripts', `${cmd}.cmd`)
      const args: string[] = ['my arg 1', 'my arg 2']
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const originalPath = process.env['Path']
      try {
        process.env['Path'] = `${originalPath};${path.dirname(cmdPath)}`
        const exitCode = await exec.exec(`${cmd}`, args, options)
        expect(exitCode).toBe(0)
        expect(outStream.getContents().split(os.EOL)[0]).toBe(
          `[command]${process.env.ComSpec} /D /S /C "${cmdPath} "my arg 1" "my arg 2""`
        )
        expect(output.trim()).toBe(
          'args[0]: "<quote>my arg 1<quote>"\r\n' +
            'args[1]: "<quote>my arg 2<quote>"'
        )
      } catch (err) {
        process.env['Path'] = originalPath
        throw err
      }
    })

    it('execs .cmd with arg quoting (Windows)', async () => {
      // this test validates .cmd quoting rules are applied, not the default libuv rules
      const cmdPath = path.join(
        __dirname,
        'scripts',
        'print args cmd with spaces.cmd'
      )
      const args: string[] = [
        'helloworld',
        'hello world',
        'hello\tworld',
        'hello&world',
        'hello(world',
        'hello)world',
        'hello[world',
        'hello]world',
        'hello{world',
        'hello}world',
        'hello^world',
        'hello=world',
        'hello;world',
        'hello!world',
        "hello'world",
        'hello+world',
        'hello,world',
        'hello`world',
        'hello~world',
        'hello|world',
        'hello<world',
        'hello>world',
        'hello:"world again"',
        'hello world\\'
      ]
      const outStream = new StringStream()
      let output = ''
      const options = {
        outStream: <stream.Writable>outStream,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }

      const exitCode = await exec.exec(`"${cmdPath}"`, args, options)
      expect(exitCode).toBe(0)
      expect(outStream.getContents().split(os.EOL)[0]).toBe(
        `[command]${process.env.ComSpec} /D /S /C ""${cmdPath}"` +
          ` helloworld` +
          ` "hello world"` +
          ` "hello\tworld"` +
          ` "hello&world"` +
          ` "hello(world"` +
          ` "hello)world"` +
          ` "hello[world"` +
          ` "hello]world"` +
          ` "hello{world"` +
          ` "hello}world"` +
          ` "hello^world"` +
          ` "hello=world"` +
          ` "hello;world"` +
          ` "hello!world"` +
          ` "hello'world"` +
          ` "hello+world"` +
          ` "hello,world"` +
          ` "hello\`world"` +
          ` "hello~world"` +
          ` "hello|world"` +
          ` "hello<world"` +
          ` "hello>world"` +
          ` "hello:""world again"""` +
          ` "hello world\\\\"` +
          `"`
      )
      expect(output.trim()).toBe(
        'args[0]: "helloworld"\r\n' +
          'args[1]: "<quote>hello world<quote>"\r\n' +
          'args[2]: "<quote>hello\tworld<quote>"\r\n' +
          'args[3]: "<quote>hello&world<quote>"\r\n' +
          'args[4]: "<quote>hello(world<quote>"\r\n' +
          'args[5]: "<quote>hello)world<quote>"\r\n' +
          'args[6]: "<quote>hello[world<quote>"\r\n' +
          'args[7]: "<quote>hello]world<quote>"\r\n' +
          'args[8]: "<quote>hello{world<quote>"\r\n' +
          'args[9]: "<quote>hello}world<quote>"\r\n' +
          'args[10]: "<quote>hello^world<quote>"\r\n' +
          'args[11]: "<quote>hello=world<quote>"\r\n' +
          'args[12]: "<quote>hello;world<quote>"\r\n' +
          'args[13]: "<quote>hello!world<quote>"\r\n' +
          'args[14]: "<quote>hello\'world<quote>"\r\n' +
          'args[15]: "<quote>hello+world<quote>"\r\n' +
          'args[16]: "<quote>hello,world<quote>"\r\n' +
          'args[17]: "<quote>hello`world<quote>"\r\n' +
          'args[18]: "<quote>hello~world<quote>"\r\n' +
          'args[19]: "<quote>hello|world<quote>"\r\n' +
          'args[20]: "<quote>hello<world<quote>"\r\n' +
          'args[21]: "<quote>hello>world<quote>"\r\n' +
          'args[22]: "<quote>hello:<quote><quote>world again<quote><quote><quote>"\r\n' +
          'args[23]: "<quote>hello world\\\\<quote>"'
      )
    })
  }
})

function getTestTemp(): string {
  return path.join(__dirname, '_temp')
}

function getExecOptions(): im.ExecOptions {
  return {
    cwd: __dirname,
    env: {},
    silent: false,
    failOnStdErr: false,
    ignoreReturnCode: false,
    outStream: outstream,
    errStream: errstream
  }
}

export class StringStream extends stream.Writable {
  constructor() {
    super()
    stream.Writable.call(this)
  }

  private contents = ''

  _write(
    data: string | Buffer | Uint8Array,
    encoding: string,
    next: Function
  ): void {
    this.contents += data
    next()
  }

  getContents(): string {
    return this.contents
  }
}

// function to compile a .NET program on Windows.
const compileExe = (sourceFileName: string, targetFileName: string): string => {
  const directory = path.join(getTestTemp(), sourceFileName)
  io.mkdirP(directory)
  const exePath = path.join(directory, targetFileName)
  // short-circuit if already compiled
  try {
    fs.statSync(exePath)
    return exePath
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  const sourceFile = path.join(__dirname, 'scripts', sourceFileName)
  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
  fs.statSync(cscPath)
  childProcess.execFileSync(cscPath, [
    '/target:exe',
    `/out:${exePath}`,
    sourceFile
  ])

  return exePath
}

// function to compile a .NET program that prints the command line args.

// the helper program is used to validate that command line args are passed correctly.

const compileArgsExe = (targetFileName: string): string => {
  return compileExe('print-args-exe.cs', targetFileName)
}
