import * as semver from 'semver'
import {debug} from '@actions/core'
import os = require('os')

/*
NOTE: versions must be sorted descending by version in the manifest
      this library short circuits on first semver spec match
[
  {
    "version": "1.2.3",
    "stable": true,
    "release_url": "https://github.com/actions/sometool/releases/tag/1.2.3-20200402.6",
    "files": [
      {
        "filename": "sometool-1.2.3-linux-x64.zip",
        "arch": "x64",
        "platform": "linux",
        "download_url": "https://github.com/actions/sometool/releases/tag/1.2.3-20200402.6/sometool-1.2.3-linux-x64.zip"
      },
    ...
    ]
  },
  ...
]
*/

export interface IToolReleaseFile {
  filename: string
  // 'aix', 'darwin', 'freebsd', 'linux', 'openbsd',
  // 'sunos', and 'win32'
  // in some images built for hosted it can also be suffixed by version
  // e.g. linux-1804
  platform: string

  // 'arm', 'arm64', 'ia32', 'mips', 'mipsel',
  // 'ppc', 'ppc64', 's390', 's390x',
  // 'x32', and 'x64'.
  arch: string

  download_url: string
}

export interface IToolRelease {
  version: string
  stable: boolean
  release_url: string
  files: IToolReleaseFile[]
}

export async function _findMatch(
  versionSpec: string,
  stable: boolean,
  candidates: IToolRelease[]
): Promise<IToolRelease | undefined> {
  const archFilter = os.arch()
  const platFilter = os.platform()

  console.log(archFilter, platFilter)

  let result: IToolRelease | undefined
  let match: IToolRelease | undefined

  let files: IToolReleaseFile | undefined
  for (const candidate of candidates) {
    const version = candidate.version

    debug(`check ${version} satisfies ${versionSpec}`)
    if (
      semver.satisfies(version, versionSpec) &&
      (!stable || candidate.stable === stable)
    ) {
      files = candidate.files.find(file => {
        debug(
          `${file.arch}===${archFilter} && ${file.platform}===${platFilter}`
        )
        // TODO: handle platform-MMmm format
        return file.arch === archFilter && file.platform === platFilter
      })

      if (files) {
        debug(`matched ${candidate.version}`)
        match = candidate
        break
      }
    }
  }

  if (match && files) {
    // clone since we're mutating the file list to be only the file that matches
    result = Object.assign({}, match)
    result.files = [files]
  }

  return result
}
