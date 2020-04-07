import * as tc from '../src/tool-cache'
import * as mm from '../src/manifest'

// needs to be require for core node modules to be mocked
// eslint-disable-next-line @typescript-eslint/no-require-imports
import osm = require('os')

// we fetch the manifest file from master of a repo
const versionsUrl =
  'https://raw.githubusercontent.com/actions/some-tool/master/versions-manifest'

// just loading data and require handles BOMs etc.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const manifestData = require('./data/versions-manifest.json')

describe('@actions/tool-cache-manifest', () => {
  let os: {platform: string; arch: string}

  let getSpy: jest.SpyInstance
  let platSpy: jest.SpyInstance
  let archSpy: jest.SpyInstance

  beforeEach(() => {
    // node
    os = {platform: '', arch: ''}
    platSpy = jest.spyOn(osm, 'platform')

    platSpy.mockImplementation(() => os.platform)
    archSpy = jest.spyOn(osm, 'arch')
    archSpy.mockImplementation(() => os.arch)

    getSpy = jest.spyOn(tc, 'getManifestFromUrl')
    getSpy.mockImplementation(() => <mm.IToolRelease[]>manifestData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    //jest.restoreAllMocks();
  })

  afterAll(async () => {}, 100000)

  it('can query versions', async () => {
    const manifest: mm.IToolRelease[] | null = await tc.getManifestFromUrl(
      versionsUrl
    )

    expect(manifest).toBeDefined()
    const l: number = manifest ? manifest.length : 0
    expect(l).toBe(4)
  })

  it('can match stable major version for linux x64', async () => {
    os.platform = 'linux'
    os.arch = 'x64'

    const manifest: mm.IToolRelease[] = await tc.getManifestFromUrl(versionsUrl)
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

    const manifest: mm.IToolRelease[] = await tc.getManifestFromUrl(versionsUrl)
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
})
