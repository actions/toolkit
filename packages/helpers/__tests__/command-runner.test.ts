import * as exec from '@actions/exec'
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
    })
  })
})
