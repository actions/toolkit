import * as semver from 'semver'
import {debug} from '@actions/core'

// needs to be require for core node modules to be mocked
/* eslint @typescript-eslint/no-require-imports: 0 */

import os = require('os')
import cp = require('child_process')
import fs = require('fs')

/*
NOTE: versions must be sorted descending by version in the manifest
      this library short circuits on first semver spec match

      platform_version is an optional filter and can be a semver spec or range
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
        "platform_version": "18.04"
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
  // platform_version is an optional semver filter
  // TODO: do we need distribution (e.g. ubuntu).
  //       not adding yet but might need someday.
  //       right now, 16.04 and 18.04 work
  platform: string
  platform_version?: string

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
  candidates: IToolRelease[],
  archFilter: string
): Promise<IToolRelease | undefined> {
  const platFilter = os.platform()

  let result: IToolRelease | undefined
  let match: IToolRelease | undefined

  let file: IToolReleaseFile | undefined
  for (const candidate of candidates) {
    const version = candidate.version

    debug(`check ${version} satisfies ${versionSpec}`)
    if (
      semver.satisfies(version, versionSpec) &&
      (!stable || candidate.stable === stable)
    ) {
      file = candidate.files.find(item => {
        debug(
          `${item.arch}===${archFilter} && ${item.platform}===${platFilter}`
        )

        let chk = item.arch === archFilter && item.platform === platFilter
        if (chk && item.platform_version) {
          const osVersion = module.exports._getOsVersion()

          if (osVersion === item.platform_version) {
            chk = true
          } else {
            chk = semver.satisfies(osVersion, item.platform_version)
          }
        }

        return chk
      })

      if (file) {
        debug(`matched ${candidate.version}`)
        match = candidate
        break
      }
    }
  }

  if (match && file) {
    // clone since we're mutating the file list to be only the file that matches
    result = Object.assign({}, match)
    result.files = [file]
  }

  return result
}

export function _getOsVersion(): string {
  // TODO: add windows and other linux, arm variants
  // right now filtering on version is only an ubuntu and macos scenario for tools we build for hosted (python)
  const plat = os.platform()
  let version = ''

  if (plat === 'darwin') {
    version = cp.execSync('sw_vers -productVersion').toString()
  } else if (plat === 'linux') {
    // lsb_release process not in some containers, readfile
    // Run cat /etc/lsb-release
    // DISTRIB_ID=Ubuntu
    // DISTRIB_RELEASE=18.04
    // DISTRIB_CODENAME=bionic
    // DISTRIB_DESCRIPTION="Ubuntu 18.04.4 LTS"
    const lsbContents = module.exports._readLinuxVersionFile()
    if (lsbContents) {
      const lines = lsbContents.split('\n')
      for (const line of lines) {
        const parts = line.split('=')
        if (
          parts.length === 2 &&
          (parts[0].trim() === 'VERSION_ID' ||
            parts[0].trim() === 'DISTRIB_RELEASE')
        ) {
          version = parts[1]
            .trim()
            .replace(/^"/, '')
            .replace(/"$/, '')
          break
        }
      }
    }
  }

  return version
}

export function _readLinuxVersionFile(): string {
  const lsbReleaseFile = '/etc/lsb-release'
  const osReleaseFile = '/etc/os-release'
  let contents = ''

  if (fs.existsSync(lsbReleaseFile)) {
    contents = fs.readFileSync(lsbReleaseFile).toString()
  } else if (fs.existsSync(osReleaseFile)) {
    contents = fs.readFileSync(osReleaseFile).toString()
  }

  return contents
}
