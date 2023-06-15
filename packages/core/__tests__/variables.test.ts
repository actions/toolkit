import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  SpyInstance,
  test,
  vi
} from 'vitest'

import {
  addPath,
  exportVariable,
  getBooleanInput,
  getInput,
  getMultilineInput,
  setCommandEcho,
  setOutput,
  setSecret
} from '../src/variables.js'
import {
  DELIMITER,
  TEST_DIRECTORY_PATH,
  TEST_ENV_VARS
} from './helpers/constants.js'
import {createFileCommandFile, verifyFileCommand} from './helpers/utils.js'

vi.mock('uuid')
describe('variables', () => {
  let stdOutSpy: SpyInstance<
    Parameters<typeof process.stdout.write>,
    ReturnType<typeof process.stdout.write>
  >

  function assertWriteCalls(calls: string[]): void {
    expect(stdOutSpy).toHaveBeenCalledTimes(calls.length)

    for (const [i, call] of calls.entries()) {
      expect(stdOutSpy).toHaveBeenNthCalledWith(i + 1, call)
    }
  }

  beforeAll(() => {
    if (!fs.existsSync(TEST_DIRECTORY_PATH)) {
      fs.mkdirSync(TEST_DIRECTORY_PATH)
    }
  })
  beforeEach(() => {
    for (const key in TEST_ENV_VARS) {
      process.env[key] = TEST_ENV_VARS[key as keyof typeof TEST_ENV_VARS]
    }
    stdOutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  describe('exportVariable', () => {
    test('legacy exportVariable produces the correct command and sets the env', () => {
      exportVariable('my var', 'var val')
      assertWriteCalls([`::set-env name=my var::var val${os.EOL}`])
    })

    test('legacy exportVariable escapes variable names', () => {
      exportVariable('special char var \r\n,:', 'special val')
      expect(process.env['special char var \r\n,:']).toBe('special val')
      assertWriteCalls([
        `::set-env name=special char var %0D%0A%2C%3A::special val${os.EOL}`
      ])
    })

    test('legacy exportVariable escapes variable values', () => {
      exportVariable('my var2', 'var val\r\n')
      expect(process.env['my var2']).toBe('var val\r\n')
      assertWriteCalls([`::set-env name=my var2::var val%0D%0A${os.EOL}`])
    })

    test('legacy exportVariable handles boolean inputs', () => {
      exportVariable('my var', true)
      assertWriteCalls([`::set-env name=my var::true${os.EOL}`])
    })

    test('legacy exportVariable handles number inputs', () => {
      exportVariable('my var', 5)
      assertWriteCalls([`::set-env name=my var::5${os.EOL}`])
    })

    test('exportVariable produces the correct command and sets the env', () => {
      const command = 'ENV'
      createFileCommandFile(command)
      exportVariable('my var', 'var val')
      verifyFileCommand(
        command,
        `my var<<${DELIMITER}${os.EOL}var val${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('exportVariable handles boolean inputs', () => {
      const command = 'ENV'
      createFileCommandFile(command)
      exportVariable('my var', true)
      verifyFileCommand(
        command,
        `my var<<${DELIMITER}${os.EOL}true${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('exportVariable handles number inputs', () => {
      const command = 'ENV'
      createFileCommandFile(command)
      exportVariable('my var', 5)
      verifyFileCommand(
        command,
        `my var<<${DELIMITER}${os.EOL}5${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('exportVariable does not allow delimiter as value', () => {
      const command = 'ENV'
      createFileCommandFile(command)

      expect(() => {
        exportVariable('my var', `good stuff ${DELIMITER} bad stuff`)
      }).toThrow(
        `Unexpected input: value should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })

    test('exportVariable does not allow delimiter as name', () => {
      const command = 'ENV'
      createFileCommandFile(command)

      expect(() => {
        exportVariable(`good stuff ${DELIMITER} bad stuff`, 'test')
      }).toThrow(
        `Unexpected input: name should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })
  })

  describe(`setSecret`, () => {
    test('setSecret produces the correct command', () => {
      expect.assertions(3)

      setSecret('secret val')
      setSecret('multi\nline\r\nsecret')
      assertWriteCalls([
        `::add-mask::secret val${os.EOL}`,
        `::add-mask::multi%0Aline%0D%0Asecret${os.EOL}`
      ])
    })
  })

  describe('addPath', () => {
    test('prependPath produces the correct commands and sets the env', () => {
      const command = 'PATH'
      createFileCommandFile(command)
      addPath('myPath')
      expect(process.env['PATH']).toBe(
        `myPath${path.delimiter}path1${path.delimiter}path2`
      )
      verifyFileCommand(command, `myPath${os.EOL}`)
    })

    test('legacy prependPath produces the correct commands and sets the env', () => {
      addPath('myPath')
      expect(process.env['PATH']).toBe(
        `myPath${path.delimiter}path1${path.delimiter}path2`
      )
      assertWriteCalls([`::add-path::myPath${os.EOL}`])
    })
  })

  describe('getInput', () => {
    test('getInput gets non-required input', () => {
      expect(getInput('my input')).toBe('val')
    })

    test('getInput gets required input', () => {
      expect(getInput('my input', {required: true})).toBe('val')
    })

    test('getInput throws on missing required input', () => {
      expect(() => getInput('missing', {required: true})).toThrow(
        'Input required and not supplied: missing'
      )
    })

    test('getInput does not throw on missing non-required input', () => {
      expect(getInput('missing', {required: false})).toBe('')
    })

    test('getInput is case insensitive', () => {
      expect(getInput('My InPuT')).toBe('val')
    })

    test('getInput handles special characters', () => {
      expect(getInput('special chars_\'\t"\\')).toBe('\'\t"\\ response')
    })

    test('getInput handles multiple spaces', () => {
      expect(getInput('multiple spaces variable')).toBe(
        'I have multiple spaces'
      )
    })

    test('getInput trims whitespace by default', () => {
      expect(getInput('with trailing whitespace')).toBe('some val')
    })

    test('getInput trims whitespace when option is explicitly true', () => {
      expect(getInput('with trailing whitespace', {trimWhitespace: true})).toBe(
        'some val'
      )
    })

    test('getInput does not trim whitespace when option is false', () => {
      expect(
        getInput('with trailing whitespace', {trimWhitespace: false})
      ).toBe('  some val  ')
    })
  })

  describe('getBooleanInput', () => {
    test('getInput gets non-required boolean input', () => {
      expect(getBooleanInput('boolean input')).toBe(true)
    })

    test('getInput gets required input', () => {
      expect(getBooleanInput('boolean input', {required: true})).toBe(true)
    })

    test('getBooleanInput handles boolean input', () => {
      expect(getBooleanInput('boolean input true1')).toBe(true)
      expect(getBooleanInput('boolean input true2')).toBe(true)
      expect(getBooleanInput('boolean input true3')).toBe(true)
      expect(getBooleanInput('boolean input false1')).toBe(false)
      expect(getBooleanInput('boolean input false2')).toBe(false)
      expect(getBooleanInput('boolean input false3')).toBe(false)
    })

    test('getBooleanInput handles wrong boolean input', () => {
      expect(() => getBooleanInput('wrong boolean input')).toThrow(
        'Input does not meet YAML 1.2 "Core Schema" specification: wrong boolean input\n' +
          `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
      )
    })
  })

  describe('getMultilineInput', () => {
    test('getMultilineInput works', () => {
      expect(getMultilineInput('my input list')).toStrictEqual([
        'val1',
        'val2',
        'val3'
      ])
    })

    test('getMultilineInput trims whitespace by default', () => {
      expect(getMultilineInput('list with trailing whitespace')).toStrictEqual([
        'val1',
        'val2'
      ])
    })

    test('getMultilineInput trims whitespace when option is explicitly true', () => {
      expect(
        getMultilineInput('list with trailing whitespace', {
          trimWhitespace: true
        })
      ).toStrictEqual(['val1', 'val2'])
    })

    test('getMultilineInput does not trim whitespace when option is false', () => {
      expect(
        getMultilineInput('list with trailing whitespace', {
          trimWhitespace: false
        })
      ).toStrictEqual(['  val1  ', '  val2  ', '  '])
    })
  })

  describe('setOutput', () => {
    test('legacy setOutput produces the correct command', () => {
      setOutput('some output', 'some value')
      assertWriteCalls([
        os.EOL,
        `::set-output name=some output::some value${os.EOL}`
      ])
    })

    test('legacy setOutput handles bools', () => {
      setOutput('some output', false)
      assertWriteCalls([
        os.EOL,
        `::set-output name=some output::false${os.EOL}`
      ])
    })

    test('legacy setOutput handles numbers', () => {
      setOutput('some output', 1.01)
      assertWriteCalls([os.EOL, `::set-output name=some output::1.01${os.EOL}`])
    })

    test('setOutput produces the correct command and sets the output', () => {
      const command = 'OUTPUT'
      createFileCommandFile(command)
      setOutput('my out', 'out val')
      verifyFileCommand(
        command,
        `my out<<${DELIMITER}${os.EOL}out val${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('setOutput handles boolean inputs', () => {
      const command = 'OUTPUT'
      createFileCommandFile(command)
      setOutput('my out', true)
      verifyFileCommand(
        command,
        `my out<<${DELIMITER}${os.EOL}true${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('setOutput handles number inputs', () => {
      const command = 'OUTPUT'
      createFileCommandFile(command)
      setOutput('my out', 5)
      verifyFileCommand(
        command,
        `my out<<${DELIMITER}${os.EOL}5${os.EOL}${DELIMITER}${os.EOL}`
      )
    })

    test('setOutput does not allow delimiter as value', () => {
      const command = 'OUTPUT'
      createFileCommandFile(command)

      expect(() => {
        setOutput('my out', `good stuff ${DELIMITER} bad stuff`)
      }).toThrow(
        `Unexpected input: value should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })

    test('setOutput does not allow delimiter as name', () => {
      const command = 'OUTPUT'
      createFileCommandFile(command)

      expect(() => {
        setOutput(`good stuff ${DELIMITER} bad stuff`, 'test')
      }).toThrow(
        `Unexpected input: name should not contain the delimiter "${DELIMITER}"`
      )

      const filePath = path.join(TEST_DIRECTORY_PATH, `${command}`)
      fs.unlinkSync(filePath)
    })
  })

  describe('setCommandEcho', () => {
    test('setCommandEcho can enable echoing', () => {
      setCommandEcho(true)
      assertWriteCalls([`::echo::on${os.EOL}`])
    })

    test('setCommandEcho can disable echoing', () => {
      setCommandEcho(false)
      assertWriteCalls([`::echo::off${os.EOL}`])
    })
  })
})
