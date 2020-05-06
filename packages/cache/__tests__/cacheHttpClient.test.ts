import {getCacheVersion} from '../src/internal/cacheHttpClient'
import {CompressionMethod} from '../src/internal/constants'

test('getCacheVersion with path input and compression method undefined returns version', async () => {
  const inputPath = 'node_modules'
  const result = getCacheVersion(inputPath)
  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

test('getCacheVersion with zstd compression returns version', async () => {
  const inputPath = 'node_modules'
  const result = getCacheVersion(inputPath, CompressionMethod.Zstd)

  expect(result).toEqual(
    '273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24'
  )
})

test('getCacheVersion with gzip compression does not change vesion', async () => {
  const inputPath = 'node_modules'
  const result = getCacheVersion(inputPath, CompressionMethod.Gzip)

  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})
