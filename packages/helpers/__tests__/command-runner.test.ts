import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as io from '@actions/io'
import {CommandRunner, createCommandRunner} from '../src/helpers'

describe('command-runner', () => {
  describe('createCommandRunner', () => {
    it('creates a command object', async () => {
      const command = createCommandRunner('echo')
      expect(command).toBeDefined()
      expect(command).toBeInstanceOf(CommandRunner)
    })
  })

  describe('CommandRunner', () => {
    const execSpy = jest.spyOn(exec, 'exec')
    const failSpy = jest.spyOn(core, 'setFailed')

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('runs basic commands', async () => {
      execSpy.mockImplementation(async () => 0)

      const command = createCommandRunner('echo', ['hello', 'world'], {
        silent: true
      })
      command.run()

      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(execSpy).toHaveBeenCalledWith(
        'echo',
        ['hello', 'world'],
        expect.objectContaining({
          silent: true,
          ignoreReturnCode: true
        })
      )
    })

    it('throws error if command is not specified', async () => {
      const command = createCommandRunner()
      await expect(command.run()).rejects.toThrow('Command was not specified')
    })

    it('will have exec error if it occured', async () => {
      execSpy.mockImplementation(async () => {
        throw new Error('test')
      })

      const command = createCommandRunner('echo', ['hello', 'world'], {
        silent: true
      })
      const context = await command.run()

      expect(context.execerr).toBeDefined()
      expect(context.execerr?.message).toBe('test')
    })

    it('allows to set command, args and options', async () => {
      execSpy.mockImplementation(async () => 0)

      createCommandRunner()
        .setCommand('echo')
        .setArgs(['hello', 'world'])
        .setOptions({silent: true})
        .run()

      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(execSpy).toHaveBeenCalledWith(
        'echo',
        ['hello', 'world'],
        expect.objectContaining({
          silent: true,
          ignoreReturnCode: true
        })
      )
    })

    it('allows to modify command, args and options', async () => {
      execSpy.mockImplementation(async () => 0)

      createCommandRunner('echo', ['hello', 'world'], {silent: true})
        .setCommand(commandLine => `${commandLine} hello world`)
        .setArgs(() => [])
        .setOptions(options => ({...options, env: {test: 'test'}}))
        .run()

      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(execSpy).toHaveBeenCalledWith(
        'echo hello world',
        [],
        expect.objectContaining({
          silent: true,
          ignoreReturnCode: true,
          env: {test: 'test'}
        })
      )
    })

    const createExecMock = (output: {
      stdout: string
      stderr: string
      exitCode: number
    }): typeof exec.exec => {
      const stdoutBuffer = Buffer.from(output.stdout, 'utf8')
      const stderrBuffer = Buffer.from(output.stderr, 'utf8')

      return async (
        commandLine?: string,
        args?: string[],
        options?: exec.ExecOptions
      ) => {
        options?.listeners?.stdout?.(stdoutBuffer)
        options?.listeners?.stderr?.(stderrBuffer)

        await new Promise(resolve => setTimeout(resolve, 5))
        return output.exitCode
      }
    }

    it('allows to use middlewares', async () => {
      execSpy.mockImplementation(
        createExecMock({stdout: 'hello', stderr: '', exitCode: 0})
      )

      const command = createCommandRunner('echo', ['hello', 'world'], {
        silent: true
      })

      const middleware = jest.fn()

      await command.use(middleware).run()

      expect(middleware).toHaveBeenCalledTimes(1)

      expect(middleware).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['hello', 'world'],
          commandLine: 'echo',
          execerr: null,
          exitCode: 0,
          options: {failOnStdErr: false, ignoreReturnCode: true, silent: true},
          stderr: '',
          stdout: 'hello'
        }),
        expect.any(Function)
      )
    })

    describe('CommandRunner.prototype.on', () => {
      it('passes control to next middleware if nothing has matched', async () => {
        execSpy.mockImplementation(
          createExecMock({
            stdout: 'hello',
            stderr: '',
            exitCode: 0
          })
        )

        const willBeCalled = jest.fn()
        const willNotBeCalled = jest.fn()
        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .on('!stdout', willNotBeCalled)
          .use(willBeCalled)
          .run()

        expect(willNotBeCalled).not.toHaveBeenCalled()
        expect(willBeCalled).toHaveBeenCalledTimes(1)
      })

      it('runs a middleware if event matches', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 0})
        )

        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .on('ok', middleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
      })

      it('runs a middleware if event matches with negation', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 1})
        )

        const middleware = jest.fn()
        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .on('!stdout', middleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
      })

      it('fails if event matches', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 1})
        )

        failSpy.mockImplementation(() => {})

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .on('!stdout', 'fail')
          .run()

        expect(failSpy).toHaveBeenCalledWith(
          `The command "echo" finished with exit code 1 and produced an empty output.`
        )
      })

      it('throws error if event matches', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 1})
        )

        const cmdPromise = createCommandRunner('echo', ['hello', 'world'])
          .onExitCode('> 0', 'throw')
          .run()

        await expect(cmdPromise).rejects.toThrow(
          'The command "echo" finished with exit code 1 and produced an empty output.'
        )
      })

      it('logs if event matches', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: 'test', exitCode: 1})
        )

        const logSpy = jest.spyOn(core, 'error')

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .on('!ok', 'log')
          .run()

        expect(logSpy).toHaveBeenCalledWith(
          'The command "echo" finished with exit code 1 and produced an error: test'
        )
      })
    })

    describe('default handlers', () => {
      test('onEmptyOutput', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'])
          .onError(notCalledMiddleware)
          .onEmptyOutput(middleware)
          .onError(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onExecutionError', async () => {
        execSpy.mockImplementation(() => {
          throw new Error('test')
        })

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onExecutionError(middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onStdError', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: 'test', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onStdError(middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onError', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: 'test', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onError(middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        execSpy.mockImplementation(() => {
          throw new Error('test')
        })

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onError(middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(2)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onSpecificError', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: 'test', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onSpecificError(/test/, middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onSuccess', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onError(notCalledMiddleware)
          .onSuccess(middleware)
          .onError(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onExitcode', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 2})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onSuccess(notCalledMiddleware)
          .onExitCode('> 0', middleware)
          .onSuccess(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })

      test('onOutput', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: 'test', stderr: '', exitCode: 0})
        )

        const notCalledMiddleware = jest.fn()
        const middleware = jest.fn()

        await createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        })
          .onError(notCalledMiddleware)
          .onOutput(/test/, middleware)
          .onError(notCalledMiddleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
        expect(notCalledMiddleware).not.toHaveBeenCalled()
      })
    })
  })

  const IS_WINDOWS = process.platform === 'win32'

  describe('no-mock testing', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('creates a command object', async () => {
      let toolpath: string
      let args: string[]
      if (IS_WINDOWS) {
        toolpath = await io.which('cmd', true)
        args = ['/c', 'echo', 'hello']
      } else {
        toolpath = await io.which('echo', true)
        args = ['hello']
      }
      const command = createCommandRunner(`"${toolpath}"`, args)
      expect(command).toBeDefined()
      expect(command).toBeInstanceOf(CommandRunner)
    })

    it('runs a command with non-zero exit code', async () => {
      const runner = createCommandRunner()

      runner.setOptions({
        silent: true
      })

      if (IS_WINDOWS) {
        runner.setCommand(await io.which('cmd', true))
        runner.setArgs(['/c', 'dir'])
      } else {
        runner.setCommand(await io.which('ls', true))
        runner.setArgs(['-l'])
      }

      runner.setArgs((args: string[]) => [...args, 'non-existent-dir'])

      const cmdPromise = runner.onError('throw').run()

      await expect(cmdPromise).rejects.toThrow()
    })

    it('runs a command with zero exit code', async () => {
      const runner = createCommandRunner()

      if (IS_WINDOWS) {
        runner.setCommand(await io.which('cmd', true))
        runner.setArgs(['/c', 'echo'])
      } else {
        runner.setCommand(await io.which('echo', true))
      }

      runner.setArgs((args: string[]) => [...args, 'hello'])

      const result = await runner.run()

      expect(result.stdout).toContain('hello')
      expect(result.exitCode).toEqual(0)
    })

    it('runs a command with empty output', async () => {
      const runner = createCommandRunner()

      if (IS_WINDOWS) {
        runner.setCommand(await io.which('cmd', true))
        runner.setArgs(['/c', 'echo.'])
      } else {
        runner.setCommand(await io.which('echo', true))
      }

      const cmdPromise = runner.onEmptyOutput('throw').run()

      await expect(cmdPromise).rejects.toThrow()
    })
  })
})
