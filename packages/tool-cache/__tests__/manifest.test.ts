import * as tc from '../src/tool-cache'
import * as mm from '../src/manifest' // --> OFF

// needs to be require for core node modules to be mocked
// eslint-disable-next-line @typescript-eslint/no-require-imports
import osm = require('os')
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cp = require('child_process')
//import {coerce} from 'semver'

// we fetch the manifest file from main of a repo
const owner = 'actions'
const repo = 'some-tool'
const fakeToken = 'notrealtoken'

// just loading data and require handles BOMs etc.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const manifestData = require('./data/versions-manifest.json')

describe('@actions/tool-cache-manifest', () => {
  let os: {platform: string; arch: string}

  let getSpy: jest.SpyInstance
  let platSpy: jest.SpyInstance
  let archSpy: jest.SpyInstance
  let execSpy: jest.SpyInstance
  let readLsbSpy: jest.SpyInstance

  beforeEach(() => {
    // node
    os = {platform: '', arch: ''}
    platSpy = jest.spyOn(osm, 'platform')

    platSpy.mockImplementation(() => os.platform)
    archSpy = jest.spyOn(osm, 'arch')
    archSpy.mockImplementation(() => os.arch)

    execSpy = jest.spyOn(cp, 'execSync')
    readLsbSpy = jest.spyOn(mm, '_readLinuxVersionFile')

    getSpy = jest.spyOn(tc, 'getManifestFromRepo')
    getSpy.mockImplementation(() => <mm.IToolRelease[]>manifestData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    //jest.restoreAllMocks();
  })

  afterAll(async () => {}, 100000)

  it('can query versions', async () => {
    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )

    expect(manifest).toBeDefined()
    const l: number = manifest ? manifest.length : 0
    expect(l).toBe(4)
  })

  it('can match stable major version for linux x64', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '2.x',
      true,
      manifest
    )
    expect(release).toBeDefined()
    expect(release?.version).toBe('2.0.2')
    expect(release?.files.length).toBe(1)
    const file = release?.files[0]
    expect(file).toBeDefined()
    expect(file?.arch).toBe('x64')
    expect(file?.platform).toBe('linux')
    expect(file?.download_url).toBe(
      'https://github.com/actions/sometool/releases/tag/2.0.2-20200402.6/sometool-2.0.2-linux-x64.tar.gz'
    )
    expect(file?.filename).toBe('sometool-2.0.2-linux-x64.tar.gz')
  })

  it('can match stable exact version for linux x64', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.3',
      true,
      manifest
    )
    expect(release).toBeDefined()
    expect(release?.version).toBe('1.2.3')
    expect(release?.files.length).toBe(1)
    const file = release?.files[0]
    expect(file).toBeDefined()
    expect(file?.arch).toBe('x64')
    expect(file?.platform).toBe('linux')
    expect(file?.download_url).toBe(
      'https://github.com/actions/sometool/releases/tag/1.2.3-20200402.6/sometool-1.2.3-linux-x64.tar.gz'
    )
    expect(file?.filename).toBe('sometool-1.2.3-linux-x64.tar.gz')
  })

  it('can match with linux platform version spec from lsb-release', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    readLsbSpy.mockImplementation(() => {
      return `DISTRIB_ID=Ubuntu
        DISTRIB_RELEASE=18.04
        DISTRIB_CODENAME=bionic
        DISTRIB_DESCRIPTION=Ubuntu 18.04.4 LTS`
    })

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.4',
      true,
      manifest
    )
    expect(release).toBeDefined()
    expect(release?.version).toBe('1.2.4')
    expect(release?.files.length).toBe(1)
    const file = release?.files[0]
    expect(file).toBeDefined()
    expect(file?.arch).toBe('x64')
    expect(file?.platform).toBe('linux')
    expect(file?.download_url).toBe(
      'https://github.com/actions/sometool/releases/tag/1.2.4-20200402.6/sometool-1.2.4-ubuntu1804-x64.tar.gz'
    )
    expect(file?.filename).toBe('sometool-1.2.4-ubuntu1804-x64.tar.gz')
  })

  it('can match with linux platform version spec from os-release', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    readLsbSpy.mockImplementation(() => {
      return `NAME="Ubuntu"
        VERSION="18.04.5 LTS (Bionic Beaver)"
        ID=ubuntu
        ID_LIKE=debian
        PRETTY_NAME="Ubuntu 18.04.5 LTS"
        VERSION_ID="18.04"
        HOME_URL="https://www.ubuntu.com/"
        SUPPORT_URL="https://help.ubuntu.com/"
        BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
        PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
        VERSION_CODENAME=bionic
        UBUNTU_CODENAME=bionic`
    })

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.4',
      true,
      manifest
    )
    expect(release).toBeDefined()
    expect(release?.version).toBe('1.2.4')
    expect(release?.files.length).toBe(1)
    const file = release?.files[0]
    expect(file).toBeDefined()
    expect(file?.arch).toBe('x64')
    expect(file?.platform).toBe('linux')
    expect(file?.download_url).toBe(
      'https://github.com/actions/sometool/releases/tag/1.2.4-20200402.6/sometool-1.2.4-ubuntu1804-x64.tar.gz'
    )
    expect(file?.filename).toBe('sometool-1.2.4-ubuntu1804-x64.tar.gz')
  })

  it('can match with darwin platform version spec', async () => {
    os.platform = 'darwin'
    os.arch = 'x64'

    execSpy.mockImplementation(() => '10.15.1')

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.4',
      true,
      manifest
    )
    expect(release).toBeDefined()
    expect(release?.version).toBe('1.2.4')
    expect(release?.files.length).toBe(1)
    const file = release?.files[0]
    expect(file).toBeDefined()
    expect(file?.arch).toBe('x64')
    expect(file?.platform).toBe('darwin')
    expect(file?.download_url).toBe(
      'https://github.com/actions/sometool/releases/tag/1.2.4-20200402.6/sometool-1.2.4-darwin1015-x64.tar.gz'
    )
    expect(file?.filename).toBe('sometool-1.2.4-darwin1015-x64.tar.gz')
  })

  it('does not match with unmatched linux platform version spec', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    readLsbSpy.mockImplementation(() => {
      return `DISTRIB_ID=Ubuntu
        DISTRIB_RELEASE=16.04
        DISTRIB_CODENAME=xenial
        DISTRIB_DESCRIPTION=Ubuntu 16.04.4 LTS`
    })

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.4',
      true,
      manifest
    )
    expect(release).toBeUndefined()
  })

  it('does not match with unmatched darwin platform version spec', async () => {
    os.platform = 'darwin'
    os.arch = 'x64'

    execSpy.mockImplementation(() => '10.14.6')

    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromRepo(
      owner,
      repo,
      fakeToken
    )
    const release: tc.IToolRelease | undefined = await tc.findFromManifest(
      '1.2.4',
      true,
      manifest
    )
    expect(release).toBeUndefined()
  })

  it('can get version from lsb on ubuntu-18.04', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    //existsSpy.mockImplementation(() => true)
    readLsbSpy.mockImplementation(() => {
      return `DISTRIB_ID=Ubuntu
        DISTRIB_RELEASE=18.04
        DISTRIB_CODENAME=bionic
        DISTRIB_DESCRIPTION=Ubuntu 18.04.4 LTS`
    })

    const version = mm._getOsVersion()

    expect(osm.platform()).toBe('linux')
    expect(version).toBe('18.04')
  })

  it('can get version from lsb on ubuntu-16.04', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    readLsbSpy.mockImplementation(() => {
      return `DISTRIB_ID=Ubuntu
        DISTRIB_RELEASE=16.04
        DISTRIB_CODENAME=xenial
        DISTRIB_DESCRIPTION="Ubuntu 16.04.6 LTS"`
    })

    const version = mm._getOsVersion()

    expect(osm.platform()).toBe('linux')
    expect(version).toBe('16.04')
  })

  // sw_vers -productVersion
  it('can get version on macOS', async () => {
    os.platform = 'darwin'
    os.arch = 'x64'

    execSpy.mockImplementation(() => '10.14.6')

    const version = mm._getOsVersion()

    expect(osm.platform()).toBe('darwin')
    expect(version).toBe('10.14.6')
  })
})
