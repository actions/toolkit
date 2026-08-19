import fs from 'fs/promises'
import http from 'http'
import os from 'os'
import path from 'path'

import {streamExtractExternal} from '../../lib/internal/download/download-artifact.js'

const mode = process.argv[2]
if (mode !== 'success' && mode !== 'failure') {
  throw new Error(`Unknown fixture mode: ${mode}`)
}

const directory = await fs.mkdtemp(
  path.join(os.tmpdir(), 'artifact-download-cleanup-')
)
let requestCount = 0

const server = http.createServer((_request, response) => {
  requestCount++
  response.writeHead(200, {
    'content-type': 'text/plain',
    'content-disposition': 'attachment; filename="artifact.txt"'
  })

  if (mode === 'success' && requestCount === 2) {
    response.end('downloaded artifact')
    return
  }

  response.write('partial response')
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
})

try {
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Fixture server did not bind a TCP port')
  }
  const url = `http://127.0.0.1:${address.port}/artifact`
  const attempts = mode === 'success' ? 2 : 3

  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await streamExtractExternal(url, directory, {timeout: 25})
      lastError = undefined
      break
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) {
    throw lastError
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()))
  })
  await fs.rm(directory, {recursive: true, force: true})
}
