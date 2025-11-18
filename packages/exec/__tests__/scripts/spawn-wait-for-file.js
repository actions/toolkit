const childProcess = require('child_process')
const path = require('path')

function parseArgs() {
  const result = {}
  for (const arg of process.argv.slice(2)) {
    const equalsIndex = arg.indexOf('=')
    if (equalsIndex === -1) {
      continue
    }
    const key = arg.slice(0, equalsIndex)
    const value = arg.slice(equalsIndex + 1)
    result[key] = value
  }

  return result
}

const args = parseArgs()
const filePath = args.file
if (!filePath) {
  throw new Error('file is not specified')
}

const waitScript = path.join(__dirname, 'wait-for-file.js')
const waitArgs = [waitScript, `file=${filePath}`]
const waitProcess = childProcess.spawn(process.execPath, waitArgs, {
  stdio: 'inherit',
  detached: false
})

waitProcess.unref()

if (args.stderr === 'true') {
  process.stderr.write('hi')
}

const exitCode = args.exitCode ? parseInt(args.exitCode, 10) : 0
process.exit(exitCode)
