import CommandHelper from '../src/exec-command-wrapper'
import * as io from '@actions/io'

const IS_WINDOWS = process.platform === 'win32'

describe('Command', () => {
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
    const command = new CommandHelper(`"${toolpath}"`, args)
    expect(command).toBeDefined()
    expect(command).toBeInstanceOf(CommandHelper)
  })

  it('runs a command with non-zero exit code', async () => {
    let toolpath: string
    let args: string[]
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      args = ['/c', 'dir', 'non-existent-dir']
    } else {
      toolpath = await io.which('ls', true)
      args = ['-l', 'non-existent-dir']
    }
    const command = new CommandHelper(`"${toolpath}"`, args, undefined, {
      throwOnEmptyOutput: true
    })
    try {
      const result = await command.execute()
      expect(result.exitCode).not.toEqual(0)
    } catch (err) {
      expect(err.message).toContain(
        `The process '${toolpath}' failed with exit code `
      )
    }
  })

  it('runs a command with zero exit code', async () => {
    let toolpath: string
    let args: string[]
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      args = ['/c', 'echo', 'hello']
    } else {
      toolpath = await io.which('echo', true)
      args = ['hello']
    }
    const command = new CommandHelper(`"${toolpath}"`, args)
    const result = await command.execute()

    expect(result.stdout).toContain('hello')
    expect(result.exitCode).toEqual(0)
  })

  it('runs a command with empty output', async () => {
    let toolpath: string
    let args: string[]
    if (IS_WINDOWS) {
      toolpath = await io.which('cmd', true)
      args = ['/c', 'echo.']
    } else {
      toolpath = await io.which('echo', true)
      args = ['']
    }

    const command = new CommandHelper(`"${toolpath}"`, args, undefined, {
      throwOnEmptyOutput: true
    })
    try {
      const result = await command.execute()
      expect(result.stdout).toBe('')
    } catch (err) {
      expect(err.message).toContain('Command produced empty output.')
    }
  })
})
