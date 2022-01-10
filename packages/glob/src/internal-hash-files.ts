import * as crypto from 'crypto'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'
import * as path from 'path'
import {Globber} from './glob'

export async function hashFiles(globber: Globber): Promise<string> {
  let hasMatch = false
  const githubWorkspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd()
  const result = crypto.createHash('sha256')
  let count = 0
  for await (const file of await sortedFiles(globber)) {
    core.debug(file)
    if (!file.startsWith(`${githubWorkspace}${path.sep}`)) {
      core.debug(`Ignore '${file}' since it is not under GITHUB_WORKSPACE.`)
      continue
    }
    if (fs.statSync(file).isDirectory()) {
      core.debug(`Skip directory '${file}'.`)
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
    core.debug(`Found ${count} files to hash.`)
    return result.digest('hex')
  } else {
    core.debug(`No matches found for glob`)
    return ''
  }
}

async function sortedFiles(globber: Globber): Promise<string[]> {
  const result: string[] = []
  for await (const file of globber.globGenerator()) {
    result.push(file)
  }
  result.sort()
  return result
}
