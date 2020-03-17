import * as semver from 'semver'
import * as os from 'os'
import {debug} from '@actions/core'

export interface IToolReleaseFile {
  // 'aix', 'darwin', 'freebsd', 'linux', 'openbsd',
  // 'sunos', and 'win32'
  os: string

  // 'arm', 'arm64', 'ia32', 'mips', 'mipsel',
  // 'ppc', 'ppc64', 's390', 's390x',
  // 'x32', and 'x64'.
  arch: string

  // zip, targz
  kind: string
  url: string
}

export interface IToolRelease {
  version: string
  stable: boolean
  files: IToolReleaseFile[]
}

export async function findMatch(
  versionSpec: string,
  stable: boolean,
  candidates: IToolRelease[]
): Promise<IToolRelease | undefined> {
  const archFilter = os.arch()
  const platFilter = os.platform()

  let result: IToolRelease | undefined
  let match: IToolRelease | undefined

  let goFile: IToolReleaseFile | undefined
  for (const candidate of candidates) {
    const version = candidate.version

    debug(`check ${version} satisfies ${versionSpec}`)
    if (
      semver.satisfies(version, versionSpec) &&
      (!stable || candidate.stable === stable)
    ) {
      goFile = candidate.files.find(file => {
        debug(`${file.arch}===${archFilter} && ${file.os}===${platFilter}`)
        return file.arch === archFilter && file.os === platFilter
      })

      if (goFile) {
        debug(`matched ${candidate.version}`)
        match = candidate
        break
      }
    }
  }

  if (match && goFile) {
    // clone since we're mutating the file list to be only the file that matches
    result = Object.assign({}, match)
    result.files = [goFile]
  }

  return result
}
