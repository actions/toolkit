const childProcess = require('child_process')
const path = require('path')

// Parse args
const args = {}
for (const arg of process.argv.slice(2)) {
  const idx = arg.indexOf('=')
  if (idx !== -1) {
    args[arg.slice(0, idx)] = arg.slice(idx + 1)
  }
}

const filePath = args.file
if (!filePath) {
  throw new Error('file is not specified')
}

// Spawn wait-for-file.js with inherited stdio
// This creates a grandchild process that holds the stdio handles open
// after this process (the child) exits
const waitScript = path.join(__dirname, 'wait-for-file.js')
const child = childProcess.spawn(process.execPath, [waitScript, `file=${filePath}`], {
  stdio: ['ignore', 'inherit', 'inherit'],
  detached: process.platform !== 'win32'
})

// Don't wait for child to exit
child.unref()

// Handle optional stderr output (must happen BEFORE we exit)
if (args.stderr === 'true') {
  process.stderr.write('hi')
}

// Small delay to ensure child has started and inherited handles
setTimeout(() => {
  const exitCode = args.exitCode ? parseInt(args.exitCode, 10) : 0
  process.exit(exitCode)
}, 50)
