import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as core from '../src/core'
import {HttpClient} from '@actions/http-client'
import {toCommandProperties} from '../src/utils'
import * as uuid from 'uuid'

jest.mock('uuid')

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
  INPUT_MULTIPLE_SPACES_VARIABLE: 'I have multiple spaces',
  INPUT_BOOLEAN_INPUT: 'true',
  INPUT_BOOLEAN_INPUT_TRUE1: 'true',
  INPUT_BOOLEAN_INPUT_TRUE2: 'True',
  INPUT_BOOLEAN_INPUT_TRUE3: 'TRUE',
  INPUT_BOOLEAN_INPUT_FALSE1: 'false',
  INPUT_BOOLEAN_INPUT_FALSE2: 'False',
  INPUT_BOOLEAN_INPUT_FALSE3: 'FALSE',
  INPUT_WRONG_BOOLEAN_INPUT: 'wrong',
  INPUT_WITH_TRAILING_WHITESPACE: '  some val  ',

  INPUT_MY_INPUT_LIST: 'val1\nval2\nval3',

  // Save inputs
  STATE_TEST_1: 'state_val',

  // File Commands
  GITHUB_PATH: '',
  GITHUB_ENV: ''
}

const UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
const DELIMITER = `ghadelimiter_${UUID}`

describe('@actions/core', () => {
  beforeAll(() => {
    const filePath = path.join(__dirname, `test`)
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
  })

  beforeEach(() => {
    for (const key in testEnvVars) {
      process.env[key] = testEnvVars[key as keyof typeof testEnvVars]
    }
    process.stdout.write = jest.fn()

    jest.spyOn(uuid, 'v4').mockImplementation(() => {
      return UUID
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('legacy exportVariable produces the correct command and sets the env', () => {
    core.exportVariable('my var', 'var val')
    assertWriteCalls([`::set-env name=my var::var val${os.EOL}`])
  })

  it('legacy exportVariable escapes variable names', () => {
    core.exportVariable('special char var \r\n,:', 'special val')
    expect(process.env['special char var \r\n,:']).toBe('special val')
    assertWriteCalls([
      `::set-env name=special char var %0D%0A%2C%3A::special val${os.EOL}`
    ])
  })

  it('legacy exportVariable escapes variable values', () => {
    core.exportVariable('my var2', 'var val\r\n')
    expect(process.env['my var2']).toBe('var val\r\n')
    assertWriteCalls([`::set-env name=my var2::var val%0D%0A${os.EOL}`])
  })

  it('legacy exportVariable handles boolean inputs', () => {
    core.exportVariable('my var', true)
    assertWriteCalls([`::set-env name=my var::true${os.EOL}`])
  })

  it('legacy exportVariable handles number inputs', () => {
    core.exportVariable('my var', 5)
    assertWriteCalls([`::set-env name=my var::5${os.EOL}`])
  })

  it('exportVariable produces the correct command and sets the env', () => {
    const command = 'ENV'
    createFileCommandFile(command)
    core.exportVariable('my var', 'var val')
    verifyFileCommand(
      command,
      `my var<<${DELIMITER}${os.EOL}var val${os.EOL}${DELIMITER}${os.EOL}`
    )
  })

  it('exportVariable handles boolean inputs', () => {
    const command = 'ENV'
    createFileCommandFile(command)
    core.exportVariable('my var', true)
    verifyFileCommand(
      command,
      `my var<<${DELIMITER}${os.EOL}true${os.EOL}${DELIMITER}${os.EOL}`
    )
  })

  it('exportVariable handles number inputs', () => {
    const command = 'ENV'
    createFileCommandFile(command)
    core.exportVariable('my var', 5)
    verifyFileCommand(
      command,
      `my var<<${DELIMITER}${os.EOL}5${os.EOL}${DELIMITER}${os.EOL}`
    )
  })

  it('exportVariable does not allow delimiter as value', () => {
    const command = 'ENV'
    createFileCommandFile(command)

    expect(() => {
      core.exportVariable('my var', `good stuff ${DELIMITER} bad stuff`)
    }).toThrow(
      `Unexpected input: value should not contain the delimiter "${DELIMITER}"`
    )

    const filePath = path.join(__dirname, `test/${command}`)
    fs.unlinkSync(filePath)
  })

  it('exportVariable does not allow delimiter as name', () => {
    const command = 'ENV'
    createFileCommandFile(command)

    expect(() => {
      core.exportVariable(`good stuff ${DELIMITER} bad stuff`, 'test')
    }).toThrow(
      `Unexpected input: name should not contain the delimiter "${DELIMITER}"`
    )

    const filePath = path.join(__dirname, `test/${command}`)
    fs.unlinkSync(filePath)
  })

  it('setSecret produces the correct command', () => {
    core.setSecret('secret val')
    assertWriteCalls([`::add-mask::secret val${os.EOL}`])
  })

  it('prependPath produces the correct commands and sets the env', () => {
    const command = 'PATH'
    createFileCommandFile(command)
    core.addPath('myPath')
    expect(process.env['PATH']).toBe(
      `myPath${path.delimiter}path1${path.delimiter}path2`
    )
    verifyFileCommand(command, `myPath${os.EOL}`)
  })

  it('legacy prependPath produces the correct commands and sets the env', () => {
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

  it('getMultilineInput works', () => {
    expect(core.getMultilineInput('my input list')).toEqual([
      'val1',
      'val2',
      'val3'
    ])
  })

  it('getInput trims whitespace by default', () => {
    expect(core.getInput('with trailing whitespace')).toBe('some val')
  })

  it('getInput trims whitespace when option is explicitly true', () => {
    expect(
      core.getInput('with trailing whitespace', {trimWhitespace: true})
    ).toBe('some val')
  })

  it('getInput does not trim whitespace when option is false', () => {
    expect(
      core.getInput('with trailing whitespace', {trimWhitespace: false})
    ).toBe('  some val  ')
  })

  it('getInput gets non-required boolean input', () => {
    expect(core.getBooleanInput('boolean input')).toBe(true)
  })

  it('getInput gets required input', () => {
    expect(core.getBooleanInput('boolean input', {required: true})).toBe(true)
  })

  it('getBooleanInput handles boolean input', () => {
    expect(core.getBooleanInput('boolean input true1')).toBe(true)
    expect(core.getBooleanInput('boolean input true2')).toBe(true)
    expect(core.getBooleanInput('boolean input true3')).toBe(true)
    expect(core.getBooleanInput('boolean input false1')).toBe(false)
    expect(core.getBooleanInput('boolean input false2')).toBe(false)
    expect(core.getBooleanInput('boolean input false3')).toBe(false)
  })

  it('getBooleanInput handles wrong boolean input', () => {
    expect(() => core.getBooleanInput('wrong boolean input')).toThrow(
      'Input does not meet YAML 1.2 "Core Schema" specification: wrong boolean input\n' +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
    )
  })

  it('setOutput produces the correct command', () => {
    core.setOutput('some output', 'some value')
    assertWriteCalls([
      os.EOL,
      `::set-output name=some output::some value${os.EOL}`
    ])
  })

  it('setOutput handles bools', () => {
    core.setOutput('some output', false)
    assertWriteCalls([os.EOL, `::set-output name=some output::false${os.EOL}`])
  })

  it('setOutput handles numbers', () => {
    core.setOutput('some output', 1.01)
    assertWriteCalls([os.EOL, `::set-output name=some output::1.01${os.EOL}`])
  })

  it('setFailed sets the correct exit code and failure message', () => {
    core.setFailed('Failure message')
    expect(process.exitCode).toBe(core.ExitCode.Failure)
    assertWriteCalls([`::error::Failure message${os.EOL}`])
  })

  it('setFailed escapes the failure message', () => {
    core.setFailed('Failure \r\n\nmessage\r')
    expect(process.exitCode).toBe(core.ExitCode.Failure)
    assertWriteCalls([`::error::Failure %0D%0A%0Amessage%0D${os.EOL}`])
  })

  it('setFailed handles Error', () => {
    const message = 'this is my error message'
    core.setFailed(new Error(message))
    expect(process.exitCode).toBe(core.ExitCode.Failure)
    assertWriteCalls([`::error::Error: ${message}${os.EOL}`])
  })

  it('error sets the correct error message', () => {
    core.error('Error message')
    assertWriteCalls([`::error::Error message${os.EOL}`])
  })

  it('error escapes the error message', () => {
    core.error('Error message\r\n\n')
    assertWriteCalls([`::error::Error message%0D%0A%0A${os.EOL}`])
  })

  it('error handles an error object', () => {
    const message = 'this is my error message'
    core.error(new Error(message))
    assertWriteCalls([`::error::Error: ${message}${os.EOL}`])
  })

  it('error handles parameters correctly', () => {
    const message = 'this is my error message'
    core.error(new Error(message), {
      title: 'A title',
      file: 'root/test.txt',
      startColumn: 1,
      endColumn: 2,
      startLine: 5,
      endLine: 5
    })
    assertWriteCalls([
      `::error title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
    ])
  })

  it('warning sets the correct message', () => {
    core.warning('Warning')
    assertWriteCalls([`::warning::Warning${os.EOL}`])
  })

  it('warning escapes the message', () => {
    core.warning('\r\nwarning\n')
    assertWriteCalls([`::warning::%0D%0Awarning%0A${os.EOL}`])
  })

  it('warning handles an error object', () => {
    const message = 'this is my error message'
    core.warning(new Error(message))
    assertWriteCalls([`::warning::Error: ${message}${os.EOL}`])
  })

  it('warning handles parameters correctly', () => {
    const message = 'this is my error message'
    core.warning(new Error(message), {
      title: 'A title',
      file: 'root/test.txt',
      startColumn: 1,
      endColumn: 2,
      startLine: 5,
      endLine: 5
    })
    assertWriteCalls([
      `::warning title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
    ])
  })

  it('notice sets the correct message', () => {
    core.notice('Notice')
    assertWriteCalls([`::notice::Notice${os.EOL}`])
  })

  it('notice escapes the message', () => {
    core.notice('\r\nnotice\n')
    assertWriteCalls([`::notice::%0D%0Anotice%0A${os.EOL}`])
  })

  it('notice handles an error object', () => {
    const message = 'this is my error message'
    core.notice(new Error(message))
    assertWriteCalls([`::notice::Error: ${message}${os.EOL}`])
  })

  it('notice handles parameters correctly', () => {
    const message = 'this is my error message'
    core.notice(new Error(message), {
      title: 'A title',
      file: 'root/test.txt',
      startColumn: 1,
      endColumn: 2,
      startLine: 5,
      endLine: 5
    })
    assertWriteCalls([
      `::notice title=A title,file=root/test.txt,line=5,endLine=5,col=1,endColumn=2::Error: ${message}${os.EOL}`
    ])
  })

  it('annotations map field names correctly', () => {
    const commandProperties = toCommandProperties({
      title: 'A title',
      file: 'root/test.txt',
      startColumn: 1,
      endColumn: 2,
      startLine: 5,
      endLine: 5
    })
    expect(commandProperties.title).toBe('A title')
    expect(commandProperties.file).toBe('root/test.txt')
    expect(commandProperties.col).toBe(1)
    expect(commandProperties.endColumn).toBe(2)
    expect(commandProperties.line).toBe(5)
    expect(commandProperties.endLine).toBe(5)

    expect(commandProperties.startColumn).toBeUndefined()
    expect(commandProperties.startLine).toBeUndefined()
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

  it('saveState produces the correct command', () => {
    core.saveState('state_1', 'some value')
    assertWriteCalls([`::save-state name=state_1::some value${os.EOL}`])
  })

  it('saveState handles numbers', () => {
    core.saveState('state_1', 1)
    assertWriteCalls([`::save-state name=state_1::1${os.EOL}`])
  })

  it('saveState handles bools', () => {
    core.saveState('state_1', true)
    assertWriteCalls([`::save-state name=state_1::true${os.EOL}`])
  })

  it('getState gets wrapper action state', () => {
    expect(core.getState('TEST_1')).toBe('state_val')
  })

  it('isDebug check debug state', () => {
    const current = process.env['RUNNER_DEBUG']
    try {
      delete process.env.RUNNER_DEBUG
      expect(core.isDebug()).toBe(false)

      process.env['RUNNER_DEBUG'] = '1'
      expect(core.isDebug()).toBe(true)
    } finally {
      process.env['RUNNER_DEBUG'] = current
    }
  })

  it('setCommandEcho can enable echoing', () => {
    core.setCommandEcho(true)
    assertWriteCalls([`::echo::on${os.EOL}`])
  })

  it('setCommandEcho can disable echoing', () => {
    core.setCommandEcho(false)
    assertWriteCalls([`::echo::off${os.EOL}`])
  })
})

// Assert that process.stdout.write calls called only with the given arguments.
function assertWriteCalls(calls: string[]): void {
  expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

  for (let i = 0; i < calls.length; i++) {
    expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i])
  }
}

function createFileCommandFile(command: string): void {
  const filePath = path.join(__dirname, `test/${command}`)
  process.env[`GITHUB_${command}`] = filePath
  fs.appendFileSync(filePath, '', {
    encoding: 'utf8'
  })
}

function verifyFileCommand(command: string, expectedContents: string): void {
  const filePath = path.join(__dirname, `test/${command}`)
  const contents = fs.readFileSync(filePath, 'utf8')
  try {
    expect(contents).toEqual(expectedContents)
  } finally {
    fs.unlinkSync(filePath)
  }
}

function getTokenEndPoint(): string {
  return 'https://vstoken.actions.githubusercontent.com/.well-known/openid-configuration'
}

describe('oidc-client-tests', () => {
  it('Get Http Client', async () => {
    const http = new HttpClient('actions/oidc-client')
    expect(http).toBeDefined()
  })

  it('HTTP get request to get token endpoint', async () => {
    const http = new HttpClient('actions/oidc-client')
    const res = await http.get(getTokenEndPoint())
    expect(res.message.statusCode).toBe(200)
  })
})
