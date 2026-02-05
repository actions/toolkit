// Certain env variables are not set by default in a shell context and are only available in a node context from a running action
// In order to be able to restore and save cache e2e in a shell when running CI tests, we need these env variables set
const fs = require('fs');
const os = require('os');
const filePath = process.env[`GITHUB_ENV`]
fs.appendFileSync(filePath, `ACTIONS_RUNTIME_TOKEN=${process.env.ACTIONS_RUNTIME_TOKEN}${os.EOL}`, {
    encoding: 'utf8'
})
fs.appendFileSync(filePath, `ACTIONS_CACHE_URL=${process.env.ACTIONS_CACHE_URL}${os.EOL}`, {
    encoding: 'utf8'
})
fs.appendFileSync(filePath, `GITHUB_RUN_ID=${process.env.GITHUB_RUN_ID}${os.EOL}`, {
    encoding: 'utf8'
})