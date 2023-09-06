import * as fs from 'fs'
import * as path from 'path'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as stream from 'stream'
import nock from 'nock'

const cachePath = path.join(__dirname, 'CACHE')
const tempPath = path.join(__dirname, 'TEMP')
// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath
process.env['RUNNER_TOOL_CACHE'] = cachePath

// eslint-disable-next-line import/first
import * as tc from '../src/tool-cache'

const IS_WINDOWS = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'

describe('@actions/tool-cache', function() {
  beforeAll(function() {
    nock('http://example.com')
      .persist()
      .get('/bytes/35')
      .reply(200, {
        username: 'abc',
        password: 'def'
      })
    setGlobal('TEST_DOWNLOAD_TOOL_RETRY_MIN_SECONDS', 0)
    setGlobal('TEST_DOWNLOAD_TOOL_RETRY_MAX_SECONDS', 0)
  })

  beforeEach(async function() {
    await io.rmRF(cachePath)
    await io.rmRF(tempPath)
    await io.mkdirP(cachePath)
    await io.mkdirP(tempPath)
  })

  afterEach(function() {
    setResponseMessageFactory(undefined)
  })

  afterAll(async function() {
    await io.rmRF(tempPath)
    await io.rmRF(cachePath)
    setGlobal('TEST_DOWNLOAD_TOOL_RETRY_MIN_SECONDS', undefined)
    setGlobal('TEST_DOWNLOAD_TOOL_RETRY_MAX_SECONDS', undefined)
  })

  it('downloads a 35 byte file', async () => {
    const downPath: string = await tc.downloadTool(
      'http://example.com/bytes/35'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('downloads a 35 byte file (dest)', async () => {
    const dest = 'test-download-file'
    try {
      const downPath: string = await tc.downloadTool(
        'http://example.com/bytes/35',
        dest
      )

      expect(downPath).toEqual(dest)
      expect(fs.existsSync(downPath)).toBeTruthy()
      expect(fs.statSync(downPath).size).toBe(35)
    } finally {
      try {
        await fs.promises.unlink(dest)
      } catch {
        // intentionally empty
      }
    }
  })

  it('downloads a 35 byte file (dest requires mkdirp)', async () => {
    const dest = 'test-download-dir/test-download-file'
    try {
      const downPath: string = await tc.downloadTool(
        'http://example.com/bytes/35',
        dest
      )

      expect(downPath).toEqual(dest)
      expect(fs.existsSync(downPath)).toBeTruthy()
      expect(fs.statSync(downPath).size).toBe(35)
    } finally {
      try {
        await fs.promises.unlink(dest)
        await fs.promises.rmdir(path.dirname(dest))
      } catch {
        // intentionally empty
      }
    }
  })

  it('downloads a 35 byte file after a redirect', async () => {
    nock('http://example.com')
      .persist()
      .get('/redirect-to')
      .reply(303, undefined, {
        location: 'http://example.com/bytes/35'
      })

    const downPath: string = await tc.downloadTool(
      'http://example.com/redirect-to'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('handles error from response message stream', async () => {
    nock('http://example.com')
      .persist()
      .get('/error-from-response-message-stream')
      .reply(200, {})

    setResponseMessageFactory(() => {
      const readStream = new stream.Readable()
      readStream._read = () => {
        readStream.destroy(new Error('uh oh'))
      }
      return readStream
    })

    let error = new Error('unexpected')
    try {
      await tc.downloadTool(
        'http://example.com/error-from-response-message-stream'
      )
    } catch (err) {
      error = err
    }

    expect(error).not.toBeUndefined()
    expect(error.message).toBe('uh oh')
  })

  it('retries error from response message stream', async () => {
    nock('http://example.com')
      .persist()
      .get('/retries-error-from-response-message-stream')
      .reply(200, {})

    let attempt = 1
    setResponseMessageFactory(() => {
      const readStream = new stream.Readable()
      let failsafe = 0
      readStream._read = () => {
        // First attempt fails
        if (attempt++ === 1) {
          readStream.destroy(new Error('uh oh'))
          return
        }

        // Write some data
        if (failsafe++ === 0) {
          readStream.push(''.padEnd(35))
          readStream.push(null) // no more data
        }
      }

      return readStream
    })

    const downPath = await tc.downloadTool(
      'http://example.com/retries-error-from-response-message-stream'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('has status code in exception dictionary for HTTP error code responses', async () => {
    nock('http://example.com')
      .persist()
      .get('/bytes/bad')
      .reply(400, {
        username: 'bad',
        password: 'file'
      })

    expect.assertions(2)

    try {
      const errorCodeUrl = 'http://example.com/bytes/bad'
      await tc.downloadTool(errorCodeUrl)
    } catch (err) {
      expect(err.toString()).toContain('Unexpected HTTP response: 400')
      expect(err['httpStatusCode']).toBe(400)
    }
  })

  it('works with redirect code 302', async function() {
    nock('http://example.com')
      .persist()
      .get('/redirect-to')
      .reply(302, undefined, {
        location: 'http://example.com/bytes/35'
      })

    const downPath: string = await tc.downloadTool(
      'http://example.com/redirect-to'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('installs a binary tool and finds it', async () => {
    const downPath: string = await tc.downloadTool(
      'http://example.com/bytes/35'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()

    await tc.cacheFile(downPath, 'foo', 'foo', '1.1.0')

    const toolPath: string = tc.find('foo', '1.1.0')
    expect(fs.existsSync(toolPath)).toBeTruthy()
    expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()

    const binaryPath: string = path.join(toolPath, 'foo')
    expect(fs.existsSync(binaryPath)).toBeTruthy()
  })

  if (IS_WINDOWS) {
    it('installs a 7z and finds it', async () => {
      const tempDir = path.join(__dirname, 'test-install-7z')
      try {
        await io.mkdirP(tempDir)

        // copy the 7z file to the test dir
        const _7zFile: string = path.join(tempDir, 'test.7z')
        await io.cp(path.join(__dirname, 'data', 'test.7z'), _7zFile)

        const destDir = path.join(tempDir, 'destination')
        await io.mkdirP(destDir)
        fs.writeFileSync(path.join(destDir, 'file.txt'), 'overwriteMe')

        // extract/cache
        const extPath: string = await tc.extract7z(_7zFile)
        await tc.cacheDir(extPath, 'my-7z-contents', '1.1.0')
        const toolPath: string = tc.find('my-7z-contents', '1.1.0')

        expect(fs.existsSync(toolPath)).toBeTruthy()
        expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
        expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
        expect(fs.readFileSync(path.join(toolPath, 'file.txt'), 'utf8')).toBe(
          'file.txt contents'
        )
        expect(
          fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
        ).toBeTruthy()
        expect(
          fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
        ).toBeTruthy()
      } finally {
        await io.rmRF(tempDir)
      }
    })

    it('extracts a 7z to a directory that does not exist', async () => {
      const tempDir = path.join(__dirname, 'test-install-7z')
      const destDir = path.join(tempDir, 'not-exist')
      try {
        await io.mkdirP(tempDir)

        // copy the 7z file to the test dir
        const _7zFile: string = path.join(tempDir, 'test.7z')
        await io.cp(path.join(__dirname, 'data', 'test.7z'), _7zFile)

        // extract/cache
        const extPath: string = await tc.extract7z(_7zFile, destDir)
        await tc.cacheDir(extPath, 'my-7z-contents', '1.1.0')
        const toolPath: string = tc.find('my-7z-contents', '1.1.0')

        expect(extPath).toContain('not-exist')
        expect(fs.existsSync(toolPath)).toBeTruthy()
        expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
        expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
        expect(
          fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
        ).toBeTruthy()
        expect(
          fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
        ).toBeTruthy()
      } finally {
        await io.rmRF(tempDir)
      }
    })

    it('extract 7z using custom 7z tool', async function() {
      const tempDir = path.join(
        __dirname,
        'test-extract-7z-using-custom-7z-tool'
      )
      try {
        await io.mkdirP(tempDir)
        // create mock7zr.cmd
        const mock7zrPath: string = path.join(tempDir, 'mock7zr.cmd')
        fs.writeFileSync(
          mock7zrPath,
          [
            'echo %* > "%~dp0mock7zr-args.txt"',
            `"${path.join(
              __dirname,
              '..',
              'scripts',
              'externals',
              '7zdec.exe'
            )}" x %5`
          ].join('\r\n')
        )

        // copy the 7z file to the test dir
        const _7zFile: string = path.join(tempDir, 'test.7z')
        await io.cp(path.join(__dirname, 'data', 'test.7z'), _7zFile)

        // extract
        const extPath: string = await tc.extract7z(
          _7zFile,
          undefined,
          mock7zrPath
        )

        expect(fs.existsSync(extPath)).toBeTruthy()
        expect(
          fs.existsSync(path.join(tempDir, 'mock7zr-args.txt'))
        ).toBeTruthy()
        expect(
          fs
            .readFileSync(path.join(tempDir, 'mock7zr-args.txt'))
            .toString()
            .trim()
        ).toBe(`x -bb0 -bd -sccUTF-8 ${_7zFile}`)
        expect(fs.existsSync(path.join(extPath, 'file.txt'))).toBeTruthy()
        expect(
          fs.existsSync(path.join(extPath, 'file-with-ç-character.txt'))
        ).toBeTruthy()
        expect(
          fs.existsSync(path.join(extPath, 'folder', 'nested-file.txt'))
        ).toBeTruthy()
      } finally {
        await io.rmRF(tempDir)
      }
    })
    it.each(['pwsh', 'powershell'])(
      'unzip properly fails with bad path (%s)',
      async powershellTool => {
        const originalPath = process.env['PATH']
        try {
          if (powershellTool === 'powershell' && IS_WINDOWS) {
            //remove pwsh from PATH temporarily to test fallback case
            process.env['PATH'] = removePWSHFromPath(process.env['PATH'])
          }

          await expect(tc.extractZip('badPath')).rejects.toThrow()
        } finally {
          process.env['PATH'] = originalPath
        }
      }
    )
  } else if (IS_MAC) {
    it('extract .xar', async () => {
      const tempDir = path.join(tempPath, 'test-install.xar')
      const sourcePath = path.join(__dirname, 'data', 'archive-content')
      const targetPath = path.join(tempDir, 'test.xar')
      await io.mkdirP(tempDir)

      // Create test archive
      const xarPath = await io.which('xar', true)
      await exec.exec(`${xarPath}`, ['-cf', targetPath, '.'], {
        cwd: sourcePath
      })

      const destDir = path.join(tempDir, 'destination')
      await io.mkdirP(destDir)
      fs.writeFileSync(path.join(destDir, 'file.txt'), 'overwriteMe')

      // extract/cache
      const extPath: string = await tc.extractXar(targetPath, destDir, ['-x'])
      await tc.cacheDir(extPath, 'my-xar-contents', '1.1.0')
      const toolPath: string = tc.find('my-xar-contents', '1.1.0')

      expect(fs.existsSync(toolPath)).toBeTruthy()
      expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
      expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
      expect(fs.readFileSync(path.join(toolPath, 'file.txt'), 'utf8')).toBe(
        'file.txt contents'
      )
      expect(
        fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
      ).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
      ).toBeTruthy()
      expect(
        fs.readFileSync(
          path.join(toolPath, 'folder', 'nested-file.txt'),
          'utf8'
        )
      ).toBe('folder/nested-file.txt contents')
    })

    it('extract .xar to a directory that does not exist', async () => {
      const tempDir = path.join(tempPath, 'test-install.xar')
      const sourcePath = path.join(__dirname, 'data', 'archive-content')
      const targetPath = path.join(tempDir, 'test.xar')
      await io.mkdirP(tempDir)

      const destDir = path.join(tempDir, 'not-exist')

      // Create test archive
      const xarPath = await io.which('xar', true)
      await exec.exec(`${xarPath}`, ['-cf', targetPath, '.'], {
        cwd: sourcePath
      })

      // extract/cache
      const extPath: string = await tc.extractXar(targetPath, destDir, '-x')
      await tc.cacheDir(extPath, 'my-xar-contents', '1.1.0')
      const toolPath: string = tc.find('my-xar-contents', '1.1.0')

      expect(fs.existsSync(toolPath)).toBeTruthy()
      expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
      expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
      ).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
      ).toBeTruthy()
      expect(
        fs.readFileSync(
          path.join(toolPath, 'folder', 'nested-file.txt'),
          'utf8'
        )
      ).toBe('folder/nested-file.txt contents')
    })

    it('extract .xar without flags', async () => {
      const tempDir = path.join(tempPath, 'test-install.xar')
      const sourcePath = path.join(__dirname, 'data', 'archive-content')
      const targetPath = path.join(tempDir, 'test.xar')
      await io.mkdirP(tempDir)

      // Create test archive
      const xarPath = await io.which('xar', true)
      await exec.exec(`${xarPath}`, ['-cf', targetPath, '.'], {
        cwd: sourcePath
      })

      // extract/cache
      const extPath: string = await tc.extractXar(targetPath, undefined)
      await tc.cacheDir(extPath, 'my-xar-contents', '1.1.0')
      const toolPath: string = tc.find('my-xar-contents', '1.1.0')

      expect(fs.existsSync(toolPath)).toBeTruthy()
      expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
      expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
      ).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
      ).toBeTruthy()
      expect(
        fs.readFileSync(
          path.join(toolPath, 'folder', 'nested-file.txt'),
          'utf8'
        )
      ).toBe('folder/nested-file.txt contents')
    })
  }

  it('extract .tar.gz', async () => {
    const tempDir = path.join(tempPath, 'test-install-tar.gz')

    await io.mkdirP(tempDir)

    // copy the .tar.gz file to the test dir
    const _tgzFile: string = path.join(tempDir, 'test.tar.gz')
    await io.cp(path.join(__dirname, 'data', 'test.tar.gz'), _tgzFile)

    //Create file to overwrite
    const destDir = path.join(tempDir, 'extract-dest')
    await io.rmRF(destDir)
    await io.mkdirP(destDir)
    fs.writeFileSync(path.join(destDir, 'file.txt'), 'overwriteMe')

    // extract/cache
    const extPath: string = await tc.extractTar(_tgzFile, destDir)
    await tc.cacheDir(extPath, 'my-tgz-contents', '1.1.0')
    const toolPath: string = tc.find('my-tgz-contents', '1.1.0')

    expect(fs.existsSync(toolPath)).toBeTruthy()
    expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
    expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
    expect(fs.readFileSync(path.join(toolPath, 'file.txt'), 'utf8')).toBe(
      'file.txt contents'
    )
    expect(
      fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
    ).toBeTruthy()
    expect(
      fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
    ).toBeTruthy()
    expect(
      fs.readFileSync(path.join(toolPath, 'folder', 'nested-file.txt'), 'utf8')
    ).toBe('folder/nested-file.txt contents')
  })

  it('extract .tar.gz to a directory that does not exist', async () => {
    const tempDir = path.join(tempPath, 'test-install-tar.gz')
    const destDir = path.join(tempDir, 'not-exist')

    await io.mkdirP(tempDir)

    // copy the .tar.gz file to the test dir
    const _tgzFile: string = path.join(tempDir, 'test.tar.gz')
    await io.cp(path.join(__dirname, 'data', 'test.tar.gz'), _tgzFile)

    // extract/cache
    const extPath: string = await tc.extractTar(_tgzFile, destDir)
    await tc.cacheDir(extPath, 'my-tgz-contents', '1.1.0')
    const toolPath: string = tc.find('my-tgz-contents', '1.1.0')

    expect(extPath).toContain('not-exist')
    expect(fs.existsSync(toolPath)).toBeTruthy()
    expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
    expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
    expect(fs.readFileSync(path.join(toolPath, 'file.txt'), 'utf8')).toBe(
      'file.txt contents'
    )
    expect(
      fs.existsSync(path.join(toolPath, 'file-with-ç-character.txt'))
    ).toBeTruthy()
    expect(
      fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
    ).toBeTruthy()
    expect(
      fs.readFileSync(path.join(toolPath, 'folder', 'nested-file.txt'), 'utf8')
    ).toBe('folder/nested-file.txt contents')
  })

  it('extract .tar.xz', async () => {
    const tempDir = path.join(tempPath, 'test-install-tar.xz')

    await io.mkdirP(tempDir)

    // copy the .tar.gz file to the test dir
    const _txzFile: string = path.join(tempDir, 'test.tar.xz')
    await io.cp(path.join(__dirname, 'data', 'test.tar.xz'), _txzFile)

    //Create file to overwrite
    const destDir = path.join(tempDir, 'extract-dest')
    await io.rmRF(destDir)
    await io.mkdirP(destDir)
    fs.writeFileSync(path.join(destDir, 'file.txt'), 'overwriteMe')

    // extract/cache
    const extPath: string = await tc.extractTar(_txzFile, destDir, 'x')
    await tc.cacheDir(extPath, 'my-txz-contents', '1.1.0')
    const toolPath: string = tc.find('my-txz-contents', '1.1.0')

    expect(fs.existsSync(toolPath)).toBeTruthy()
    expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
    expect(fs.existsSync(path.join(toolPath, 'bar.txt'))).toBeTruthy()
    expect(fs.existsSync(path.join(toolPath, 'foo', 'hello.txt'))).toBeTruthy()
    expect(
      fs.readFileSync(path.join(toolPath, 'foo', 'hello.txt'), 'utf8')
    ).toBe('foo/hello: world')
  })

  it.each(['pwsh', 'powershell'])(
    'installs a zip and finds it (%s)',
    async powershellTool => {
      const tempDir = path.join(__dirname, 'test-install-zip')
      const originalPath = process.env['PATH']
      try {
        await io.mkdirP(tempDir)

        // stage the layout for a zip file:
        //   file.txt
        //   folder/nested-file.txt
        const stagingDir = path.join(tempDir, 'zip-staging')
        await io.mkdirP(path.join(stagingDir, 'folder'))
        fs.writeFileSync(path.join(stagingDir, 'file.txt'), '')
        fs.writeFileSync(path.join(stagingDir, 'folder', 'nested-file.txt'), '')

        // create the zip
        const zipFile = path.join(tempDir, 'test.zip')
        await io.rmRF(zipFile)
        if (IS_WINDOWS) {
          const escapedStagingPath = stagingDir.replace(/'/g, "''") // double-up single quotes
          const escapedZipFile = zipFile.replace(/'/g, "''")
          const powershellPath =
            (await io.which('pwsh', false)) ||
            (await io.which('powershell', true))
          const args = [
            '-NoLogo',
            '-Sta',
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Unrestricted',
            '-Command',
            `$ErrorActionPreference = 'Stop' ; Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedStagingPath}', '${escapedZipFile}')`
          ]
          await exec.exec(`"${powershellPath}"`, args)
        } else {
          const zipPath: string = await io.which('zip', true)
          await exec.exec(`"${zipPath}`, [zipFile, '-r', '.'], {
            cwd: stagingDir
          })
        }

        if (powershellTool === 'powershell' && IS_WINDOWS) {
          //remove pwsh from PATH temporarily to test fallback case
          process.env['PATH'] = removePWSHFromPath(process.env['PATH'])
        }

        const extPath: string = await tc.extractZip(zipFile)
        await tc.cacheDir(extPath, 'foo', '1.1.0')
        const toolPath: string = tc.find('foo', '1.1.0')

        expect(fs.existsSync(toolPath)).toBeTruthy()
        expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
        expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
        expect(
          fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
        ).toBeTruthy()
      } finally {
        await io.rmRF(tempDir)
        process.env['PATH'] = originalPath
      }
    }
  )

  it('installs a zip and extracts it to specified directory', async function() {
    const tempDir = path.join(__dirname, 'test-install-zip')
    try {
      await io.mkdirP(tempDir)

      // stage the layout for a zip file:
      //   file.txt
      //   folder/nested-file.txt
      const stagingDir = path.join(tempDir, 'zip-staging')
      await io.mkdirP(path.join(stagingDir, 'folder'))
      fs.writeFileSync(path.join(stagingDir, 'file.txt'), 'originalText')
      fs.writeFileSync(path.join(stagingDir, 'folder', 'nested-file.txt'), '')

      // create the zip
      const zipFile = path.join(tempDir, 'test.zip')
      await io.rmRF(zipFile)
      if (IS_WINDOWS) {
        const escapedStagingPath = stagingDir.replace(/'/g, "''") // double-up single quotes
        const escapedZipFile = zipFile.replace(/'/g, "''")
        const powershellPath =
          (await io.which('pwsh', false)) ||
          (await io.which('powershell', true))
        const args = [
          '-NoLogo',
          '-Sta',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Unrestricted',
          '-Command',
          `$ErrorActionPreference = 'Stop' ; Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedStagingPath}', '${escapedZipFile}')`
        ]
        await exec.exec(`"${powershellPath}"`, args)
      } else {
        const zipPath: string = await io.which('zip', true)
        await exec.exec(zipPath, [zipFile, '-r', '.'], {cwd: stagingDir})
      }

      const destDir = path.join(__dirname, 'unzip-dest')
      await io.rmRF(destDir)
      await io.mkdirP(destDir)
      try {
        fs.writeFileSync(path.join(destDir, 'file.txt'), 'overwriteMe')
        const extPath: string = await tc.extractZip(zipFile, destDir)
        await tc.cacheDir(extPath, 'foo', '1.1.0')
        const toolPath: string = tc.find('foo', '1.1.0')
        expect(fs.existsSync(toolPath)).toBeTruthy()
        expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
        expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
        expect(fs.readFileSync(path.join(toolPath, 'file.txt'), 'utf8')).toBe(
          'originalText'
        )
        expect(
          fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
        ).toBeTruthy()
      } finally {
        await io.rmRF(destDir)
      }
    } finally {
      await io.rmRF(tempDir)
    }
  })

  it('extract zip to a directory that does not exist', async function() {
    const tempDir = path.join(__dirname, 'test-install-zip')
    try {
      await io.mkdirP(tempDir)

      // stage the layout for a zip file:
      //   file.txt
      //   folder/nested-file.txt
      const stagingDir = path.join(tempDir, 'zip-staging')
      await io.mkdirP(path.join(stagingDir, 'folder'))
      fs.writeFileSync(path.join(stagingDir, 'file.txt'), '')
      fs.writeFileSync(path.join(stagingDir, 'folder', 'nested-file.txt'), '')

      // create the zip
      const zipFile = path.join(tempDir, 'test.zip')
      await io.rmRF(zipFile)
      if (IS_WINDOWS) {
        const escapedStagingPath = stagingDir.replace(/'/g, "''") // double-up single quotes
        const escapedZipFile = zipFile.replace(/'/g, "''")
        const powershellPath =
          (await io.which('pwsh', false)) ||
          (await io.which('powershell', true))
        const args = [
          '-NoLogo',
          '-Sta',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Unrestricted',
          '-Command',
          `$ErrorActionPreference = 'Stop' ; Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedStagingPath}', '${escapedZipFile}')`
        ]
        await exec.exec(`"${powershellPath}"`, args)
      } else {
        const zipPath: string = await io.which('zip', true)
        await exec.exec(zipPath, [zipFile, '-r', '.'], {cwd: stagingDir})
      }

      const destDir = path.join(tempDir, 'not-exist')

      const extPath: string = await tc.extractZip(zipFile, destDir)
      await tc.cacheDir(extPath, 'foo', '1.1.0')
      const toolPath: string = tc.find('foo', '1.1.0')

      expect(extPath).toContain('not-exist')
      expect(fs.existsSync(toolPath)).toBeTruthy()
      expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
      expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
      expect(
        fs.existsSync(path.join(toolPath, 'folder', 'nested-file.txt'))
      ).toBeTruthy()
    } finally {
      await io.rmRF(tempDir)
    }
  })

  it('works with a 502 temporary failure', async function() {
    nock('http://example.com')
      .get('/temp502')
      .twice()
      .reply(502, undefined)
    nock('http://example.com')
      .get('/temp502')
      .reply(200, undefined)

    const statusCodeUrl = 'http://example.com/temp502'
    await tc.downloadTool(statusCodeUrl)
  })

  it("doesn't retry 502s more than 3 times", async function() {
    nock('http://example.com')
      .get('/perm502')
      .times(3)
      .reply(502, undefined)

    expect.assertions(1)

    try {
      const statusCodeUrl = 'http://example.com/perm502'
      await tc.downloadTool(statusCodeUrl)
    } catch (err) {
      expect(err.toString()).toContain('502')
    }
  })

  it('retries 429s', async function() {
    nock('http://example.com')
      .get('/too-many-requests-429')
      .times(2)
      .reply(429, undefined)
    nock('http://example.com')
      .get('/too-many-requests-429')
      .reply(500, undefined)

    try {
      const statusCodeUrl = 'http://example.com/too-many-requests-429'
      await tc.downloadTool(statusCodeUrl)
    } catch (err) {
      expect(err.toString()).toContain('500')
    }
  })

  it("doesn't retry 404", async function() {
    nock('http://example.com')
      .get('/not-found-404')
      .reply(404, undefined)
    nock('http://example.com')
      .get('/not-found-404')
      .reply(500, undefined)

    try {
      const statusCodeUrl = 'http://example.com/not-found-404'
      await tc.downloadTool(statusCodeUrl)
    } catch (err) {
      expect(err.toString()).toContain('404')
    }
  })

  it('supports authorization headers', async function() {
    nock('http://example.com', {
      reqheaders: {
        authorization: 'token abc123'
      }
    })
      .get('/some-file-that-needs-authorization')
      .reply(200, undefined)

    await tc.downloadTool(
      'http://example.com/some-file-that-needs-authorization',
      undefined,
      'token abc123'
    )
  })

  it('supports custom headers', async function() {
    nock('http://example.com', {
      reqheaders: {
        accept: 'application/octet-stream'
      }
    })
      .get('/some-file-that-needs-headers')
      .reply(200, undefined)

    await tc.downloadTool(
      'http://example.com/some-file-that-needs-headers',
      undefined,
      undefined,
      {
        accept: 'application/octet-stream'
      }
    )
  })

  it('supports authorization and custom headers', async function() {
    nock('http://example.com', {
      reqheaders: {
        accept: 'application/octet-stream',
        authorization: 'token abc123'
      }
    })
      .get('/some-file-that-needs-authorization-and-headers')
      .reply(200, undefined)

    await tc.downloadTool(
      'http://example.com/some-file-that-needs-authorization-and-headers',
      undefined,
      'token abc123',
      {
        accept: 'application/octet-stream'
      }
    )
  })
})

/**
 * Sets up a mock response body for downloadTool. This function works around a limitation with
 * nock when the response stream emits an error.
 */
function setResponseMessageFactory(
  factory: (() => stream.Readable) | undefined
): void {
  setGlobal('TEST_DOWNLOAD_TOOL_RESPONSE_MESSAGE_FACTORY', factory)
}

/**
 * Sets a global variable
 */
function setGlobal<T>(key: string, value: T | undefined): void {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const g = global as any
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (value === undefined) {
    delete g[key]
  } else {
    g[key] = value
  }
}

function removePWSHFromPath(pathEnv: string | undefined): string {
  return (pathEnv || '')
    .split(';')
    .filter(segment => {
      return !segment.startsWith(`C:\\Program Files\\PowerShell`)
    })
    .join(';')
}
