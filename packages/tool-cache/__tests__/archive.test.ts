import {Archive} from '../src/tool-cache'
import * as tc from '../src/tool-cache'

describe('archive-extractor', () => {
  describe('getArchiveType', () => {
    it('detects 7z', async () => {
      const type = await Archive.getArchiveType(
        require.resolve('./data/test.7z')
      )
      expect(type).toEqual('7z')
    })

    it('detects tar', async () => {
      const type1 = await Archive.getArchiveType(
        require.resolve('./data/test.tar.gz')
      )
      expect(type1).toEqual('tar')

      const type2 = await Archive.getArchiveType(
        require.resolve('./data/test.tar.xz')
      )

      expect(type2).toEqual('tar')
    })

    it('detects zip', async () => {
      const type = await Archive.getArchiveType(
        require.resolve('./data/test.zip')
      )
      expect(type).toEqual('zip')
    })

    it('throws on unsupported type', async () => {
      await expect(
        Archive.getArchiveType(require.resolve('./data/test.notarchive'))
      ).rejects.toThrow('Unable to determine archive type')
    })

    it('throws on non-existent file', async () => {
      await expect(Archive.getArchiveType('non-existent-file')).rejects.toThrow(
        'Unable to open non-existent-file'
      )
    })
  })

  describe('retrieveArchive', () => {
    it('downloads archive', async () => {
      const downloadToolSpy = jest.spyOn(tc, 'downloadTool')

      downloadToolSpy.mockImplementation(async () =>
        Promise.resolve('dummy-path')
      )

      await Archive.retrieve('https://test', {
        type: 'zip',
        downloadPath: 'dummy-download-path'
      })

      expect(downloadToolSpy).toHaveBeenLastCalledWith(
        'https://test',
        'dummy-download-path',
        undefined,
        undefined
      )

      downloadToolSpy.mockRestore()
    })

    it('extracts zip', async () => {
      const extractZipSpy = jest.spyOn(tc, 'extractZip')

      extractZipSpy.mockImplementation(async () =>
        Promise.resolve('dummy-path')
      )

      const archive = new Archive.ZipArchive('dummy-path')
      await archive.extract('dummy-dest')

      expect(extractZipSpy).toHaveBeenLastCalledWith('dummy-path', 'dummy-dest')

      extractZipSpy.mockRestore()
    })

    it('extracts tar', async () => {
      const extractTarSpy = jest.spyOn(tc, 'extractTar')

      extractTarSpy.mockImplementation(async () =>
        Promise.resolve('dummy-path')
      )

      const archive = new Archive.TarArchive('dummy-path')

      await archive.extract('dummy-dest', ['flag1', 'flag2'])

      expect(extractTarSpy).toHaveBeenLastCalledWith(
        'dummy-path',
        'dummy-dest',
        ['flag1', 'flag2']
      )

      extractTarSpy.mockRestore()
    })

    it('extracts 7z', async () => {
      const extract7zSpy = jest.spyOn(tc, 'extract7z')

      extract7zSpy.mockImplementation(async () => Promise.resolve('dummy-path'))

      const archive = new Archive.SevenZipArchive('dummy-path')

      await archive.extract('dummy-dest', 'dummy-7z-path')

      expect(extract7zSpy).toHaveBeenLastCalledWith(
        'dummy-path',
        'dummy-dest',
        'dummy-7z-path'
      )

      extract7zSpy.mockRestore()
    })
  })
})
