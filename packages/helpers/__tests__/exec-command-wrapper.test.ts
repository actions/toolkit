import {Command} from '../src/exec-command-wrapper'
import * as io from '@actions/io'

const IS_LINUX = process.platform === 'linux'

describe('Command', () => {
  it('creates a command object', async () => {
    if (IS_LINUX) {
      const toolpath = await io.which('echo', true)
      const command = new Command(`"${toolpath}"`, ['hello'])
      expect(command).toBeDefined()
      expect(command).toBeInstanceOf(Command)
    }
  })

  it('runs a command with non-zero exit code', async () => {
    if (IS_LINUX) {
      const nonExistentDir = 'non-existent-dir'
      const toolpath = await io.which('ls', true)
      const args = ['-l', nonExistentDir]
      const command = new Command(`"${toolpath}"`, args)

      let failed = false

      await command.execute().catch(err => {
        failed = true
        expect(err.message).toContain(
          `The process '${toolpath}' failed with exit code `
        )
      })

      expect(failed).toBe(true)
    }
  })

  it('runs a command with zero exit code', async () => {
    if (IS_LINUX) {
      const toolpath = await io.which('echo', true)
      const command = new Command(`"${toolpath}"`, ['hello'])
      const result = await command.execute()
      expect(result).toEqual('hello')
    }
  })

  it('runs a command with empty output', async () => {
    if (IS_LINUX) {
      const toolpath = await io.which('echo', true)
      const command = new Command(`"${toolpath}"`, [''])
      const result = await command.execute()
      expect(result).toEqual('')
    }
  })
})
