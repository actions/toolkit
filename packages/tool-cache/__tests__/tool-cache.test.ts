import * as fs from 'fs'
import * as nock from 'nock'
import * as path from 'path'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as tc from '../src/tool-cache'

'use strict'

const cachePath = path.join(__dirname, 'CACHE')
const tempPath = path.join(__dirname, 'TEMP')
const IS_WINDOWS = process.platform === 'win32'

describe('@actions/toolCache', function() {
  beforeAll(function() {
    nock('http://microsoft.com')
      .persist()
      .get('/bytes/35')
      .reply(200, {
        username: 'abc',
        password: 'def'
      })
  })

  beforeEach(async function() {
    await io.rmRF(cachePath)
    await io.rmRF(tempPath)
    await io.mkdirP(cachePath)
    await io.mkdirP(tempPath)
    process.env['RUNNER_TEMPDIRECTORY'] = tempPath
    process.env['RUNNER_TOOLSDIRECTORY'] = cachePath
  })

  afterAll(async function() {
    await io.rmRF(tempPath)
    await io.rmRF(cachePath)
  })

  it('downloads a 35 byte file', async () => {
    const downPath: string = await tc.downloadTool(
      'http://microsoft.com/bytes/35'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('downloads a 35 byte file after a redirect', async () => {
    nock('http://microsoft.com')
      .get('/redirect-to')
      .reply(303, undefined, {
        location: 'http://microsoft.com/bytes/35'
      })

    const downPath: string = await tc.downloadTool(
      'http://microsoft.com/redirect-to'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('has status code in exception dictionary for HTTP error code responses', async () => {
    nock('http://microsoft.com')
      .get('/bytes/bad')
      .reply(400, {
        username: 'bad',
        password: 'file'
      })

    try {
      const errorCodeUrl = 'http://microsoft.com/bytes/bad'
      await tc.downloadTool(errorCodeUrl)
      throw new Error('Should have failed')
    } catch (err) {
      expect(err.toString()).toContain('Unexpected HTTP response: 400')
    }
  })

  it('works with redirect code 302', async function() {
    nock('http://microsoft.com')
      .get('/redirect-to')
      .reply(302, undefined, {
        location: 'http://microsoft.com/bytes/35'
      })

    const downPath: string = await tc.downloadTool(
      'http://microsoft.com/redirect-to'
    )

    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  })

  it('installs a binary tool and finds it', async () => {
    const downPath: string = await tc.downloadTool(
      'http://microsoft.com/bytes/35'
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

        // extract/cache
        const extPath: string = await tc.extract7z(_7zFile)
        await tc.cacheDir(extPath, 'my-7z-contents', '1.1.0')
        const toolPath: string = tc.find('my-7z-contents', '1.1.0')

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
  }

  it('installs a zip and finds it', async () => {
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
        const powershellPath = await io.which('powershell', true)
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
        const zipPath: string = path.join(__dirname, 'externals', 'zip')
        await exec.exec(`"${zipPath}`, [zipFile, '-r', '.'], {cwd: stagingDir})
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
    }
  })

  it('installs a zip and extracts it to specified directory', async function() {
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
        const powershellPath = await io.which('powershell', true)
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
        const zipPath = path.join(__dirname, 'externals', 'zip')
        await exec.exec(zipPath, [zipFile, '-r', '.'], {cwd: stagingDir})
      }

      const destDir = path.join(__dirname, 'unzip-dest')
      await io.rmRF(destDir)
      await io.mkdirP(destDir)
      try {
        const extPath: string = await tc.extractZip(zipFile, destDir)
        await tc.cacheDir(extPath, 'foo', '1.1.0')
        const toolPath: string = tc.find('foo', '1.1.0')
        expect(fs.existsSync(toolPath)).toBeTruthy()
        expect(fs.existsSync(`${toolPath}.complete`)).toBeTruthy()
        expect(fs.existsSync(path.join(toolPath, 'file.txt'))).toBeTruthy()
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

  it('works with a 502 temporary failure', async function() {
    nock('http://microsoft.com')
      .get('/temp502')
      .twice()
      .reply(502, undefined)
    nock('http://microsoft.com')
      .get('/temp502')
      .reply(200, undefined)

    const statusCodeUrl = 'http://microsoft.com/temp502'
    await tc.downloadTool(statusCodeUrl)
  })

  it("doesn't retry 502s more than 3 times", async function() {
    nock('http://microsoft.com')
      .get('/perm502')
      .times(3)
      .reply(502, undefined)

    let thrown = false
    try {
      const statusCodeUrl = 'http://microsoft.com/perm502'
      await tc.downloadTool(statusCodeUrl)
    } catch (err) {
      thrown = true
    }
    expect(thrown).toBeTruthy()
  })
})
