import {getCacheVersion} from '../src/internal/cacheHttpClient'
import {CompressionMethod} from '../src/internal/constants'

test('getCacheVersion with one path returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths)
  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

test('getCacheVersion with multiple paths returns version', async () => {
  const paths = ['node_modules', 'dist']
  const result = getCacheVersion(paths)
  expect(result).toEqual(
    '165c3053bc646bf0d4fac17b1f5731caca6fe38e0e464715c0c3c6b6318bf436'
  )
})

test('getCacheVersion with zstd compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Zstd)

  expect(result).toEqual(
    '273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24'
  )
})

test('getCacheVersion with gzip compression does not change vesion', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Gzip)

  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})
