import * as os from 'os'
import * as path from 'path'
import * as core from '../src/core'

/* eslint-disable @typescript-eslint/unbound-method */

const testEnvVars = {
  'my var': '',
  'special char var \r\n];': '',
  'my var2': '',
  'my secret': '',
  'special char secret \r\n];': '',
  'my secret2': '',
  PATH: `path1${path.delimiter}path2`,

  // Set inputs
  INPUT_MY_INPUT: 'val',
  INPUT_MISSING: '',
  'INPUT_SPECIAL_CHARS_\'\t"\\': '\'\t"\\ response ',
  INPUT_MULTIPLE_SPACES_VARIABLE: 'I have multiple spaces'
}

describe('@actions/core', () => {
  beforeEach(() => {
    for (const key in testEnvVars)
      process.env[key] = testEnvVars[key as keyof typeof testEnvVars]

    process.stdout.write = jest.fn()
  })

  afterEach(() => {
    for (const key in testEnvVars) Reflect.deleteProperty(testEnvVars, key)
  })

  it('exportVariable produces the correct command and sets the env', () => {
    core.exportVariable('my var', 'var val')
    assertWriteCalls([`::set-env name=my var,::var val${os.EOL}`])
  })

  it('exportVariable escapes variable names', () => {
    core.exportVariable('special char var \r\n];', 'special val')
    expect(process.env['special char var \r\n];']).toBe('special val')
    assertWriteCalls([
      `::set-env name=special char var %0D%0A%5D%3B,::special val${os.EOL}`
    ])
  })

  it('exportVariable escapes variable values', () => {
    core.exportVariable('my var2', 'var val\r\n')
    expect(process.env['my var2']).toBe('var val\r\n')
    assertWriteCalls([`::set-env name=my var2,::var val%0D%0A${os.EOL}`])
  })

  // it('exportSecret produces the correct commands and sets the env', () => {
  //   core.exportSecret('my secret', 'secret val')
  //   expect(process.env['my secret']).toBe('secret val')
  //   assertWriteCalls([
  //     `::set-env name=my secret,::secret val${os.EOL}`,
  //     `::set-secret]secret val${os.EOL}`
  //   ])
  // })

  // it('exportSecret escapes secret names', () => {
  //   core.exportSecret('special char secret \r\n];', 'special secret val')
  //   expect(process.env['special char secret \r\n];']).toBe('special secret val')
  //   assertWriteCalls([
  //     `::set-env name=special char secret %0D%0A%5D%3B,::special secret val${
  //       os.EOL
  //     }`,
  //     `::set-secret]special secret val${os.EOL}`
  //   ])
  // })

  // it('exportSecret escapes secret values', () => {
  //   core.exportSecret('my secret2', 'secret val\r\n')
  //   expect(process.env['my secret2']).toBe('secret val\r\n')
  //   assertWriteCalls([
  //     `::set-env name=my secret2,::secret val%0D%0A${os.EOL}`,
  //     `::set-secret]secret val%0D%0A${os.EOL}`
  //   ])
  // })

  it('prependPath produces the correct commands and sets the env', () => {
    core.addPath('myPath')
    expect(process.env['PATH']).toBe(
      `myPath${path.delimiter}path1${path.delimiter}path2`
    )
    assertWriteCalls([`::add-path::myPath${os.EOL}`])
  })

  it('getInput gets non-required input', () => {
    expect(core.getInput('my input')).toBe('val')
  })

  it('getInput gets required input', () => {
    expect(core.getInput('my input', {required: true})).toBe('val')
  })

  it('getInput throws on missing required input', () => {
    expect(() => core.getInput('missing', {required: true})).toThrow(
      'Input required and not supplied: missing'
    )
  })

  it('getInput does not throw on missing non-required input', () => {
    expect(core.getInput('missing', {required: false})).toBe('')
  })

  it('getInput is case insensitive', () => {
    expect(core.getInput('My InPuT')).toBe('val')
  })

  it('getInput handles special characters', () => {
    expect(core.getInput('special chars_\'\t"\\')).toBe('\'\t"\\ response')
  })

  it('getInput handles multiple spaces', () => {
    expect(core.getInput('multiple spaces variable')).toBe(
      'I have multiple spaces'
    )
  })

  it('setOutput produces the correct command', () => {
    core.setOutput('some output', 'some value')
    assertWriteCalls([`::set-output name=some output,::some value${os.EOL}`])
  })

  it('setNeutral sets the correct exit code', () => {
    core.setFailed('Failure message')
    expect(process.exitCode).toBe(core.ExitCode.Failure)
  })

  it('setFailure sets the correct exit code and failure message', () => {
    core.setFailed('Failure message')
    expect(process.exitCode).toBe(core.ExitCode.Failure)
    assertWriteCalls([`::error::Failure message${os.EOL}`])
  })

  it('setFailure escapes the failure message', () => {
    core.setFailed('Failure \r\n\nmessage\r')
    expect(process.exitCode).toBe(core.ExitCode.Failure)
    assertWriteCalls([`::error::Failure %0D%0A%0Amessage%0D${os.EOL}`])
  })

  it('error sets the correct error message', () => {
    core.error('Error message')
    assertWriteCalls([`::error::Error message${os.EOL}`])
  })

  it('error escapes the error message', () => {
    core.error('Error message\r\n\n')
    assertWriteCalls([`::error::Error message%0D%0A%0A${os.EOL}`])
  })

  it('warning sets the correct message', () => {
    core.warning('Warning')
    assertWriteCalls([`::warning::Warning${os.EOL}`])
  })

  it('warning escapes the message', () => {
    core.warning('\r\nwarning\n')
    assertWriteCalls([`::warning::%0D%0Awarning%0A${os.EOL}`])
  })

  it('startGroup starts a new group', () => {
    core.startGroup('my-group')
    assertWriteCalls([`::group::my-group${os.EOL}`])
  })

  it('endGroup ends new group', () => {
    core.endGroup()
    assertWriteCalls([`::endgroup::${os.EOL}`])
  })

  it('group wraps an async call in a group', async () => {
    const result = await core.group('mygroup', async () => {
      process.stdout.write('in my group\n')
      return true
    })
    expect(result).toBe(true)
    assertWriteCalls([
      `::group::mygroup${os.EOL}`,
      'in my group\n',
      `::endgroup::${os.EOL}`
    ])
  })

  it('debug sets the correct message', () => {
    core.debug('Debug')
    assertWriteCalls([`::debug::Debug${os.EOL}`])
  })

  it('debug escapes the message', () => {
    core.debug('\r\ndebug\n')
    assertWriteCalls([`::debug::%0D%0Adebug%0A${os.EOL}`])
  })
})

// Assert that process.stdout.write calls called only with the given arguments.
function assertWriteCalls(calls: string[]): void {
  expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

  for (let i = 0; i < calls.length; i++) {
    expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i])
  }
}
