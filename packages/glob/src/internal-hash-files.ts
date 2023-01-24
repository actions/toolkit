import * as crypto from 'crypto'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'
import * as path from 'path'
import {Globber} from './glob'

export async function hashFiles(
  globber: Globber,
  currentWorkspace: string,
  verbose: Boolean = false
): Promise<string> {
  const writeDelegate = verbose ? core.info : core.debug
  let hasMatch = false
  const githubWorkspace = currentWorkspace
    ? currentWorkspace
    : process.env['GITHUB_WORKSPACE'] ?? process.cwd()
  const result = crypto.createHash('sha256')
  let count = 0
  for await (const file of globber.globGenerator()) {
    writeDelegate(file)
    if (!file.startsWith(`${githubWorkspace}${path.sep}`)) {
      writeDelegate(`Ignore '${file}' since it is not under GITHUB_WORKSPACE.`)
      continue
    }
    if (fs.statSync(file).isDirectory()) {
      writeDelegate(`Skip directory '${file}'.`)
      continue
    }
    const hash = crypto.createHash('sha256')
    const pipeline = util.promisify(stream.pipeline)
    await pipeline(fs.createReadStream(file), hash)
    result.write(hash.digest())
    count++
    if (!hasMatch) {
      hasMatch = true
    }
  }
  result.end()

  if (hasMatch) {
    writeDelegate(`Found ${count} files to hash.`)
    return result.digest('hex')
  } else {
    writeDelegate(`No matches found for glob`)
    return ''
  }
}
