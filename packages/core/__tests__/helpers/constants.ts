import path from 'node:path'
import url from 'node:url'

export const TEST_ENV_VAR_PATH = `path1${path.delimiter}path2`

export const TEST_ENV_VARS = {
  'my var': '',
  'special char var \r\n];': '',
  'my var2': '',
  'my secret': '',
  'special char secret \r\n];': '',
  'my secret2': '',
  PATH: TEST_ENV_VAR_PATH,

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
  INPUT_LIST_WITH_TRAILING_WHITESPACE: '  val1  \n  val2  \n  ',

  // Save inputs
  STATE_TEST_1: 'state_val',

  // File Commands
  GITHUB_PATH: '',
  GITHUB_ENV: '',
  GITHUB_OUTPUT: '',
  GITHUB_STATE: ''
}

export const UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
export const DELIMITER = `ghadelimiter_${UUID}`
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const TEST_DIRECTORY_PATH = path.join(__dirname, '_temp')
