// Certain env variables are not set by default in a shell context and are only available in a node context from a running action
// In order to be able to upload and download artifacts e2e in a shell when running CI tests, we need these env variables set
console.log(`::set-env name=ACTIONS_RUNTIME_URL::${process.env.ACTIONS_RUNTIME_URL}`)
console.log(`::set-env name=ACTIONS_RUNTIME_TOKEN::${process.env.ACTIONS_RUNTIME_TOKEN}`)
console.log(`::set-env name=GITHUB_RUN_ID::${process.env.GITHUB_RUN_ID}`)