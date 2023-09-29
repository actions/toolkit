import * as exec from '@actions/exec'
import {CommandRunner, commandPipeline} from '../src/helpers'

describe('command-runner', () => {
  describe('commandPipeline', () => {
    it('creates a command object', async () => {
      const command = commandPipeline('echo')
      expect(command).toBeDefined()
      expect(command).toBeInstanceOf(CommandRunner)
    })
  })

  describe('CommandRunner', () => {
    const execSpy = jest.spyOn(exec, 'getExecOutput')

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('runs basic commands', async () => {
      execSpy.mockImplementation(async () =>
        Promise.resolve({
          stdout: 'hello',
          stderr: '',
          exitCode: 0
        })
      )

      const command = commandPipeline('echo', ['hello', 'world'], {
        silent: true
      })
      command.run()

      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(execSpy).toHaveBeenCalledWith('echo', ['hello', 'world'], {
        silent: true
      })
    })

    it('overrides args with addArgs and withArgs', async () => {
      execSpy.mockImplementation(async () =>
        Promise.resolve({
          stdout: 'hello',
          stderr: '',
          exitCode: 0
        })
      )

      const command = commandPipeline('echo', ['hello', 'world'], {
        silent: true
      })

      await command.withArgs('bye').run()

      expect(execSpy).toHaveBeenCalledWith('echo', ['bye'], {
        silent: true
      })

      execSpy.mockClear()

      await command.addArgs('and stuff').run()

      expect(execSpy).toHaveBeenCalledWith(
        'echo',
        ['hello', 'world', 'and stuff'],
        {
          silent: true
        }
      )
    })

    it('allows to use middlewares', async () => {
      execSpy.mockImplementation(async () => {
        return {
          stdout: 'hello',
          stderr: '',
          exitCode: 0
        }
      })

      const command = commandPipeline('echo', ['hello', 'world'], {
        silent: true
      })

      const middleware = jest.fn()

      await command.use(middleware).run()

      expect(middleware).toHaveBeenCalledTimes(1)

      expect(middleware).toHaveBeenCalledWith(
        expect.objectContaining({
          commandLine: 'echo',
          args: ['hello', 'world'],
          options: {
            silent: true
          },
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
        execSpy.mockImplementation(async () => {
          return {
            stdout: 'hello',
            stderr: '',
            exitCode: 0
          }
        })

        const willBeCalled = jest.fn()
        const willNotBeCalled = jest.fn()
        await commandPipeline('echo', ['hello', 'world'], {
          silent: true
        })
          .on('no-stdout', willNotBeCalled)
          .use(willBeCalled)
          .run()

        expect(willNotBeCalled).not.toHaveBeenCalled()
        expect(willBeCalled).toHaveBeenCalledTimes(1)
      })

      it('runs a middleware if event matches', async () => {
        execSpy.mockImplementation(async () => {
          return {
            stdout: 'hello',
            stderr: '',
            exitCode: 0
          }
        })

        const middleware = jest.fn()

        await commandPipeline('echo', ['hello', 'world'], {
          silent: true
        })
          .on('ok', middleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
      })

      it('runs a middleware if event matches with negation', async () => {
        execSpy.mockImplementation(async () => {
          return {
            stdout: 'hello',
            stderr: '',
            exitCode: 0
          }
        })

        const middleware = jest.fn()
        await commandPipeline('echo', ['hello', 'world'], {
          silent: true
        })
          .on('!no-stdout', middleware)
          .run()

        expect(middleware).toHaveBeenCalledTimes(1)
      })

      it('runs a middleware on multiple events', async () => {
        execSpy.mockImplementation(async () => {
          return {
            stdout: 'hello',
            stderr: '',
            exitCode: 0
          }
        })

        const middleware = jest.fn()
        const command = commandPipeline('echo', ['hello', 'world'], {
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
      })
    })
  })
})
