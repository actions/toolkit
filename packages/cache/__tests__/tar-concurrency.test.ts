import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as path from 'path'
import * as tar from '../src/internal/tar'
import * as utils from '../src/internal/cacheUtils'
import {CompressionMethod} from '../src/internal/constants'

jest.mock('@actions/exec')
jest.mock('@actions/io')

const describeWindows = process.platform === 'win32' ? describe : describe.skip
type Operation = 'extract' | 'list'

interface Fixture {
  file: string
  content: string
}

describeWindows.each([
  CompressionMethod.Zstd,
  CompressionMethod.ZstdWithoutLong
])('Windows BSD tar isolation (%s)', compression => {
  const fixtures: Fixture[] = [
    {file: 'first.txt', content: 'first archive'},
    {file: 'second.txt', content: 'second archive'}
  ]
  const originalWorkspace = process.env['GITHUB_WORKSPACE']
  let root: string
  let workspace: string
  let archives: string[]
  let listedFiles: string[]
  let failStage: 'decompress' | 'tar' | undefined
  let afterDecompression: () => Promise<void>

  beforeEach(async () => {
    jest.restoreAllMocks()
    const tempRoot = path.join(__dirname, '_temp')
    await fs.promises.mkdir(tempRoot, {recursive: true})
    root = await fs.promises.mkdtemp(path.join(tempRoot, 'tar-concurrency-'))
    workspace = path.join(root, 'workspace')
    const archiveDirectory = path.join(root, 'archives')
    await fs.promises.mkdir(workspace)
    await fs.promises.mkdir(archiveDirectory)
    archives = fixtures.map((fixture, index) => {
      const archive = path.join(archiveDirectory, `${index}.tzst`)
      fs.writeFileSync(archive, JSON.stringify(fixture))
      return archive
    })
    fs.writeFileSync(path.join(root, 'cache.tar'), 'unrelated existing file')
    listedFiles = []
    failStage = undefined
    afterDecompression = async () => {}
    process.env['GITHUB_WORKSPACE'] = workspace
    jest.spyOn(utils, 'getGnuTarPathOnWindows').mockResolvedValue('')
    jest.spyOn(utils, 'createTempDirectory').mockImplementation(async () => {
      return fs.promises.mkdtemp(path.join(root, 'scratch-'))
    })
    jest.spyOn(io, 'mkdirP').mockImplementation(async directory => {
      await fs.promises.mkdir(path.resolve(directory), {recursive: true})
    })
    jest.spyOn(io, 'rmRF').mockImplementation(async directory => {
      await fs.promises.rm(directory, {recursive: true, force: true})
    })

    // Model the filesystem effects of zstd and tar without requiring either
    // program to be installed. The fixture content stands in for archive data.
    jest
      .spyOn(exec, 'exec')
      .mockImplementation(async (command, args, options) => {
        const argv = (command.match(/"[^"]*"|\S+/g) || []).map(argument =>
          argument.replace(/^"|"$/g, '')
        )
        argv.push(...(args || []))
        // Redirect the default command cwd to avoid writing into the checkout.
        const cwd = options?.cwd || root
        if (argv[0] === 'zstd') {
          const source = path.resolve(cwd, argv[argv.length - 1])
          const output = path.resolve(cwd, argv[argv.indexOf('-o') + 1])
          fs.copyFileSync(source, output)
          if (failStage === 'decompress') {
            throw new Error('simulated decompression failure')
          }
          await afterDecompression()
        } else {
          if (failStage === 'tar') {
            throw new Error('simulated tar failure')
          }
          const extracting = argv.includes('-xf')
          const source = path.resolve(
            cwd,
            argv[argv.indexOf(extracting ? '-xf' : '-tf') + 1]
          )
          const fixture: Fixture = JSON.parse(fs.readFileSync(source, 'utf8'))
          if (extracting) {
            const destination = path.resolve(cwd, argv[argv.indexOf('-C') + 1])
            await fs.promises.mkdir(destination, {recursive: true})
            fs.writeFileSync(
              path.join(destination, fixture.file),
              fixture.content
            )
          } else {
            listedFiles.push(fixture.file)
          }
        }
        return 0
      })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    if (originalWorkspace === undefined) {
      delete process.env['GITHUB_WORKSPACE']
    } else {
      process.env['GITHUB_WORKSPACE'] = originalWorkspace
    }
    await fs.promises.rm(root, {recursive: true, force: true})
  })

  async function readArchive(
    operation: Operation,
    archive: string
  ): Promise<void> {
    if (operation === 'extract') {
      await tar.extractTar(archive, compression)
    } else {
      await tar.listTar(archive, compression)
    }
  }

  function expectCleanScratch(): void {
    expect(fs.readdirSync(root).sort()).toEqual([
      'archives',
      'cache.tar',
      'workspace'
    ])
    expect(fs.readFileSync(path.join(root, 'cache.tar'), 'utf8')).toBe(
      'unrelated existing file'
    )
    for (const [index, archive] of archives.entries()) {
      expect(JSON.parse(fs.readFileSync(archive, 'utf8'))).toEqual(
        fixtures[index]
      )
    }
  }

  test.each<[Operation, Operation]>([
    ['extract', 'extract'],
    ['list', 'list'],
    ['extract', 'list']
  ])('keeps concurrent %s and %s results separate', async (first, second) => {
    let arrivals = 0
    let release: () => void = () => {}
    const bothDecompressed = new Promise<void>(resolve => {
      release = resolve
    })
    afterDecompression = async () => {
      if (++arrivals === 2) {
        release()
      }
      await bothDecompressed
    }

    // Both inputs share a parent directory. Force their decompressions to
    // finish before either tar reads, reproducing the old shared-file race.
    const operations = [first, second]
    await Promise.all(
      operations.map(async (operation, index) => {
        await readArchive(operation, archives[index])
      })
    )

    expect(fs.readdirSync(workspace).sort()).toEqual(
      fixtures
        .filter((_, index) => operations[index] === 'extract')
        .map(f => f.file)
    )
    expect(listedFiles.sort()).toEqual(
      fixtures
        .filter((_, index) => operations[index] === 'list')
        .map(f => f.file)
    )
    expectCleanScratch()
  })

  test('preserves relative archive and workspace paths containing spaces', async () => {
    const archive = path.join(root, 'archives', 'archive with spaces.tar')
    fs.renameSync(archives[0], archive)
    archives[0] = archive
    const relativeArchive = path.relative(process.cwd(), archive)
    const destination = path.join(workspace, 'directory with spaces')
    process.env['GITHUB_WORKSPACE'] = path.relative(process.cwd(), destination)

    await tar.extractTar(relativeArchive, compression)

    expect(
      fs.readFileSync(path.join(destination, fixtures[0].file), 'utf8')
    ).toBe(fixtures[0].content)
    expectCleanScratch()
  })

  test.each<[Operation, 'decompress' | 'tar']>([
    ['extract', 'decompress'],
    ['extract', 'tar'],
    ['list', 'decompress'],
    ['list', 'tar']
  ])(
    'cleans temporary files when %s fails during %s',
    async (operation, stage) => {
      failStage = stage

      await expect(readArchive(operation, archives[0])).rejects.toThrow(
        'simulated'
      )

      expectCleanScratch()
    }
  )
})
