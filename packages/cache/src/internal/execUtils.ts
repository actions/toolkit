import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function getVersion(app: string): Promise<string> {
  core.debug(`Checking ${app} --version`)
  let versionOutput = ''
  try {
    await exec.exec(`${app} --version`, [], {
      ignoreReturnCode: true,
      silent: true,
      listeners: {
        stdout: (data: Buffer): string => (versionOutput += data.toString()),
        stderr: (data: Buffer): string => (versionOutput += data.toString())
      }
    })
  } catch (err) {
    core.debug(err.message)
  }

  versionOutput = versionOutput.trim()
  core.debug(versionOutput)
  return versionOutput
}
