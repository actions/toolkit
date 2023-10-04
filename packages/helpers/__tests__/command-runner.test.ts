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
          commandLine: 'echo',
          args: ['hello', 'world'],
          options: expect.objectContaining({
            silent: true
          }),
          stdout: 'hello',
          stderr: '',
          exitCode: 0,
          execerr: null,
          state: null
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

      it('runs a middleware on multiple events', async () => {
        execSpy.mockImplementation(
          createExecMock({stdout: 'foo', stderr: '', exitCode: 1})
        )
        /* execSpy.mockImplementation(
          createExecMock({stdout: '', stderr: '', exitCode: 1})
        )

        const middleware = jest.fn()
        const command = createCommandRunner('echo', ['hello', 'world'], {
          silent: true
        }).on(['!no-stdout', 'ok'], middleware)

        await command.run()

        expect(middleware).toHaveBeenCalledTimes(1)

        execSpy.mockImplementation(async () => {
          return {
            stdout: '',
            stderr: '',
            exitCode: 1
          }
        })

        await command.run()

        expect(middleware).toHaveBeenCalledTimes(1)
        */
      })
    })
  })
})
