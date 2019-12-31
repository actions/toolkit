import * as pathHelper from '../src/internal-path-helper'

const IS_WINDOWS = process.platform === 'win32'

describe('path-helper', () => {
  it('dirname interprets directory name from paths', () => {
    assertDirectoryName('', '.')
    assertDirectoryName('.', '.')
    assertDirectoryName('..', '.')
    assertDirectoryName('hello', '.')
    assertDirectoryName('hello/', '.')
    assertDirectoryName('hello/world', 'hello')

    if (IS_WINDOWS) {
      // Removes redundant slashes
      assertDirectoryName('C:\\\\hello\\\\\\world\\\\', 'C:\\hello')
      assertDirectoryName('C://hello///world//', 'C:\\hello')
      // Relative root:
      assertDirectoryName('\\hello\\\\world\\\\again\\\\', '\\hello\\world')
      assertDirectoryName('/hello///world//again//', '\\hello\\world')
      // UNC:
      assertDirectoryName('\\\\hello\\world\\again\\', '\\\\hello\\world')
      assertDirectoryName(
        '\\\\hello\\\\\\world\\\\again\\\\',
        '\\\\hello\\world'
      )
      assertDirectoryName(
        '\\\\\\hello\\\\\\world\\\\again\\\\',
        '\\\\hello\\world'
      )
      assertDirectoryName(
        '\\\\\\\\hello\\\\\\world\\\\again\\\\',
        '\\\\hello\\world'
      )
      assertDirectoryName('//hello///world//again//', '\\\\hello\\world')
      assertDirectoryName('///hello///world//again//', '\\\\hello\\world')
      assertDirectoryName('/////hello///world//again//', '\\\\hello\\world')
      // Relative:
      assertDirectoryName('hello\\world', 'hello')

      // Directory trimming
      assertDirectoryName('a:/hello', 'a:\\')
      assertDirectoryName('z:/hello', 'z:\\')
      assertDirectoryName('A:/hello', 'A:\\')
      assertDirectoryName('Z:/hello', 'Z:\\')
      assertDirectoryName('C:/', 'C:\\')
      assertDirectoryName('C:/hello', 'C:\\')
      assertDirectoryName('C:/hello/', 'C:\\')
      assertDirectoryName('C:/hello/world', 'C:\\hello')
      assertDirectoryName('C:/hello/world/', 'C:\\hello')
      assertDirectoryName('C:', 'C:')
      assertDirectoryName('C:hello', 'C:')
      assertDirectoryName('C:hello/', 'C:')
      assertDirectoryName('C:hello/world', 'C:hello')
      assertDirectoryName('C:hello/world/', 'C:hello')
      assertDirectoryName('/', '\\')
      assertDirectoryName('/hello', '\\')
      assertDirectoryName('/hello/', '\\')
      assertDirectoryName('/hello/world', '\\hello')
      assertDirectoryName('/hello/world/', '\\hello')
      assertDirectoryName('\\', '\\')
      assertDirectoryName('\\hello', '\\')
      assertDirectoryName('\\hello\\', '\\')
      assertDirectoryName('\\hello\\world', '\\hello')
      assertDirectoryName('\\hello\\world\\', '\\hello')
      assertDirectoryName('//hello', '\\\\hello')
      assertDirectoryName('//hello/', '\\\\hello')
      assertDirectoryName('//hello/world', '\\\\hello\\world')
      assertDirectoryName('//hello/world/', '\\\\hello\\world')
      assertDirectoryName('\\\\hello', '\\\\hello')
      assertDirectoryName('\\\\hello\\', '\\\\hello')
      assertDirectoryName('\\\\hello\\world', '\\\\hello\\world')
      assertDirectoryName('\\\\hello\\world\\', '\\\\hello\\world')
      assertDirectoryName('//hello/world/again', '\\\\hello\\world')
      assertDirectoryName('//hello/world/again/', '\\\\hello\\world')
      assertDirectoryName('hello/world/', 'hello')
      assertDirectoryName('hello/world/again', 'hello\\world')
      assertDirectoryName('../../hello', '..\\..')
    } else {
      // Should not converts slashes
      assertDirectoryName('/hello\\world', '/')
      assertDirectoryName('/hello\\world/', '/')
      assertDirectoryName('\\\\hello\\world\\again', '.')
      assertDirectoryName('\\\\hello\\world/', '.')
      assertDirectoryName('\\\\hello\\world/again', '\\\\hello\\world')
      assertDirectoryName('hello\\world', '.')
      assertDirectoryName('hello\\world/', '.')

      // Should remove redundant slashes (rooted paths; UNC format not special)
      assertDirectoryName('//hello', '/')
      assertDirectoryName('//hello/world', '/hello')
      assertDirectoryName('//hello/world/', '/hello')
      assertDirectoryName('//hello//world//', '/hello')
      assertDirectoryName('///hello////world///', '/hello')

      // Should remove redundant slashes (relative paths)
      assertDirectoryName('hello//world//again//', 'hello/world')
      assertDirectoryName('hello///world///again///', 'hello/world')

      // Directory trimming (Windows drive root format not special)
      assertDirectoryName('C:/', '.')
      assertDirectoryName('C:/hello', 'C:')
      assertDirectoryName('C:/hello/', 'C:')
      assertDirectoryName('C:/hello/world', 'C:/hello')
      assertDirectoryName('C:/hello/world/', 'C:/hello')
      assertDirectoryName('C:', '.')
      assertDirectoryName('C:hello', '.')
      assertDirectoryName('C:hello/', '.')
      assertDirectoryName('C:hello/world', 'C:hello')
      assertDirectoryName('C:hello/world/', 'C:hello')

      // Directory trimming (rooted paths)
      assertDirectoryName('/', '/')
      assertDirectoryName('/hello', '/')
      assertDirectoryName('/hello/', '/')
      assertDirectoryName('/hello/world', '/hello')
      assertDirectoryName('/hello/world/', '/hello')

      // Directory trimming (relative paths)
      assertDirectoryName('hello/world/', 'hello')
      assertDirectoryName('hello/world/again', 'hello/world')
      assertDirectoryName('../../hello', '../..')
    }
  })

  it('ensureAbsoluteRoot roots paths', () => {
    if (IS_WINDOWS) {
      const currentDrive = process.cwd().substr(0, 2)
      expect(currentDrive.match(/^[A-Z]:$/i)).toBeTruthy()
      const otherDrive = currentDrive.toUpperCase().startsWith('C')
        ? 'D:'
        : 'C:'

      // Preserves relative pathing
      assertEnsureAbsoluteRoot('C:/foo', '.', `C:/foo\\.`)
      assertEnsureAbsoluteRoot('C:/foo/..', 'bar', `C:/foo/..\\bar`)
      assertEnsureAbsoluteRoot('C:/foo', 'bar/../baz', `C:/foo\\bar/../baz`)

      // Already rooted - drive root
      assertEnsureAbsoluteRoot('D:\\', 'C:/', 'C:/')
      assertEnsureAbsoluteRoot('D:\\', 'a:/hello', 'a:/hello')
      assertEnsureAbsoluteRoot('D:\\', 'C:\\', 'C:\\')
      assertEnsureAbsoluteRoot('D:\\', 'C:\\hello', 'C:\\hello')

      // Already rooted - relative current drive root
      expect(process.cwd().length).toBeGreaterThan(3) // sanity check not drive root
      assertEnsureAbsoluteRoot(`${otherDrive}\\`, currentDrive, process.cwd())
      assertEnsureAbsoluteRoot(
        `${otherDrive}\\`,
        `${currentDrive}hello`,
        `${process.cwd()}\\hello`
      )
      assertEnsureAbsoluteRoot(
        `${otherDrive}\\`,
        `${currentDrive}hello/world`,
        `${process.cwd()}\\hello/world`
      )
      assertEnsureAbsoluteRoot(
        `${otherDrive}\\`,
        `${currentDrive}hello\\world`,
        `${process.cwd()}\\hello\\world`
      )

      // Already rooted - relative other drive root
      assertEnsureAbsoluteRoot(
        `${currentDrive}\\`,
        otherDrive,
        `${otherDrive}\\`
      )
      assertEnsureAbsoluteRoot(
        `${currentDrive}\\`,
        `${otherDrive}hello`,
        `${otherDrive}\\hello`
      )
      assertEnsureAbsoluteRoot(
        `${currentDrive}\\`,
        `${otherDrive}hello/world`,
        `${otherDrive}\\hello/world`
      )
      assertEnsureAbsoluteRoot(
        `${currentDrive}\\`,
        `${otherDrive}hello\\world`,
        `${otherDrive}\\hello\\world`
      )

      // Already rooted - current drive root
      assertEnsureAbsoluteRoot(`${otherDrive}\\`, '/', `${currentDrive}\\`)
      assertEnsureAbsoluteRoot(
        `${otherDrive}\\`,
        '/hello',
        `${currentDrive}\\hello`
      )
      assertEnsureAbsoluteRoot(`${otherDrive}\\`, '\\', `${currentDrive}\\`)
      assertEnsureAbsoluteRoot(
        `${otherDrive}\\`,
        '\\hello',
        `${currentDrive}\\hello`
      )

      // Already rooted - UNC
      assertEnsureAbsoluteRoot('D:\\', '//machine/share', '//machine/share')
      assertEnsureAbsoluteRoot(
        'D:\\',
        '\\\\machine\\share',
        '\\\\machine\\share'
      )

      // Relative
      assertEnsureAbsoluteRoot('D:/', 'hello', 'D:/hello')
      assertEnsureAbsoluteRoot('D:/', 'hello/world', 'D:/hello/world')
      assertEnsureAbsoluteRoot('D:\\', 'hello', 'D:\\hello')
      assertEnsureAbsoluteRoot('D:\\', 'hello\\world', 'D:\\hello\\world')
      assertEnsureAbsoluteRoot('D:/root', 'hello', 'D:/root\\hello')
      assertEnsureAbsoluteRoot('D:/root', 'hello/world', 'D:/root\\hello/world')
      assertEnsureAbsoluteRoot('D:\\root', 'hello', 'D:\\root\\hello')
      assertEnsureAbsoluteRoot(
        'D:\\root',
        'hello\\world',
        'D:\\root\\hello\\world'
      )
      assertEnsureAbsoluteRoot('D:/root/', 'hello', 'D:/root/hello')
      assertEnsureAbsoluteRoot('D:/root/', 'hello/world', 'D:/root/hello/world')
      assertEnsureAbsoluteRoot('D:\\root\\', 'hello', 'D:\\root\\hello')
      assertEnsureAbsoluteRoot(
        'D:\\root\\',
        'hello\\world',
        'D:\\root\\hello\\world'
      )
    } else {
      // Preserves relative pathing
      assertEnsureAbsoluteRoot('/foo', '.', `/foo/.`)
      assertEnsureAbsoluteRoot('/foo/..', 'bar', `/foo/../bar`)
      assertEnsureAbsoluteRoot('/foo', 'bar/../baz', `/foo/bar/../baz`)

      // Already rooted
      assertEnsureAbsoluteRoot('/root', '/', '/')
      assertEnsureAbsoluteRoot('/root', '/hello', '/hello')
      assertEnsureAbsoluteRoot('/root', '/hello/world', '/hello/world')

      // Not already rooted - Windows style drive root
      assertEnsureAbsoluteRoot('/root', 'C:/', '/root/C:/')
      assertEnsureAbsoluteRoot('/root', 'C:/hello', '/root/C:/hello')
      assertEnsureAbsoluteRoot('/root', 'C:\\', '/root/C:\\')

      // Not already rooted - Windows style relative drive root
      assertEnsureAbsoluteRoot('/root', 'C:', '/root/C:')
      assertEnsureAbsoluteRoot('/root', 'C:hello/world', '/root/C:hello/world')

      // Not already rooted - Windows style current drive root
      assertEnsureAbsoluteRoot('/root', '\\', '/root/\\')
      assertEnsureAbsoluteRoot(
        '/root',
        '\\hello\\world',
        '/root/\\hello\\world'
      )

      // Not already rooted - Windows style UNC
      assertEnsureAbsoluteRoot(
        '/root',
        '\\\\machine\\share',
        '/root/\\\\machine\\share'
      )

      // Not already rooted - relative
      assertEnsureAbsoluteRoot('/', 'hello', '/hello')
      assertEnsureAbsoluteRoot('/', 'hello/world', '/hello/world')
      assertEnsureAbsoluteRoot('/', 'hello\\world', '/hello\\world')
      assertEnsureAbsoluteRoot('/root', 'hello', '/root/hello')
      assertEnsureAbsoluteRoot('/root', 'hello/world', '/root/hello/world')
      assertEnsureAbsoluteRoot('/root', 'hello\\world', '/root/hello\\world')
      assertEnsureAbsoluteRoot('/root/', 'hello', '/root/hello')
      assertEnsureAbsoluteRoot('/root/', 'hello/world', '/root/hello/world')
      assertEnsureAbsoluteRoot('/root/', 'hello\\world', '/root/hello\\world')
      assertEnsureAbsoluteRoot('/root\\', 'hello', '/root\\/hello')
      assertEnsureAbsoluteRoot('/root\\', 'hello/world', '/root\\/hello/world')
      assertEnsureAbsoluteRoot(
        '/root\\',
        'hello\\world',
        '/root\\/hello\\world'
      )
    }
  })

  it('hasAbsoluteRoot detects absolute root', () => {
    if (IS_WINDOWS) {
      // Drive root
      assertHasAbsoluteRoot('C:/', true)
      assertHasAbsoluteRoot('a:/hello', true)
      assertHasAbsoluteRoot('c:/hello', true)
      assertHasAbsoluteRoot('z:/hello', true)
      assertHasAbsoluteRoot('A:/hello', true)
      assertHasAbsoluteRoot('C:/hello', true)
      assertHasAbsoluteRoot('Z:/hello', true)
      assertHasAbsoluteRoot('C:\\', true)
      assertHasAbsoluteRoot('C:\\hello', true)

      // Relative drive root
      assertHasAbsoluteRoot('C:', false)
      assertHasAbsoluteRoot('C:hello', false)
      assertHasAbsoluteRoot('C:hello/world', false)
      assertHasAbsoluteRoot('C:hello\\world', false)

      // Current drive root
      assertHasAbsoluteRoot('/', false)
      assertHasAbsoluteRoot('/hello', false)
      assertHasAbsoluteRoot('/hello/world', false)
      assertHasAbsoluteRoot('\\', false)
      assertHasAbsoluteRoot('\\hello', false)
      assertHasAbsoluteRoot('\\hello\\world', false)

      // UNC
      assertHasAbsoluteRoot('//machine/share', true)
      assertHasAbsoluteRoot('//machine/share/', true)
      assertHasAbsoluteRoot('//machine/share/hello', true)
      assertHasAbsoluteRoot('\\\\machine\\share', true)
      assertHasAbsoluteRoot('\\\\machine\\share\\', true)
      assertHasAbsoluteRoot('\\\\machine\\share\\hello', true)

      // Relative
      assertHasAbsoluteRoot('hello', false)
      assertHasAbsoluteRoot('hello/world', false)
      assertHasAbsoluteRoot('hello\\world', false)
    } else {
      // Root
      assertHasAbsoluteRoot('/', true)
      assertHasAbsoluteRoot('/hello', true)
      assertHasAbsoluteRoot('/hello/world', true)

      // Windows style drive root - false on OSX/Linux
      assertHasAbsoluteRoot('C:/', false)
      assertHasAbsoluteRoot('a:/hello', false)
      assertHasAbsoluteRoot('c:/hello', false)
      assertHasAbsoluteRoot('z:/hello', false)
      assertHasAbsoluteRoot('A:/hello', false)
      assertHasAbsoluteRoot('C:/hello', false)
      assertHasAbsoluteRoot('Z:/hello', false)
      assertHasAbsoluteRoot('C:\\', false)
      assertHasAbsoluteRoot('C:\\hello', false)

      // Windows style relative drive root - false on OSX/Linux
      assertHasAbsoluteRoot('C:', false)
      assertHasAbsoluteRoot('C:hello', false)
      assertHasAbsoluteRoot('C:hello/world', false)
      assertHasAbsoluteRoot('C:hello\\world', false)

      // Windows style current drive root - false on OSX/Linux
      assertHasAbsoluteRoot('\\', false)
      assertHasAbsoluteRoot('\\hello', false)
      assertHasAbsoluteRoot('\\hello\\world', false)

      // Windows style UNC - false on OSX/Linux
      assertHasAbsoluteRoot('\\\\machine\\share', false)
      assertHasAbsoluteRoot('\\\\machine\\share\\', false)
      assertHasAbsoluteRoot('\\\\machine\\share\\hello', false)

      // Relative
      assertHasAbsoluteRoot('hello', false)
      assertHasAbsoluteRoot('hello/world', false)
      assertHasAbsoluteRoot('hello\\world', false)
    }
  })

  it('hasRoot detects root', () => {
    if (IS_WINDOWS) {
      // Drive root
      assertHasRoot('C:/', true)
      assertHasRoot('a:/hello', true)
      assertHasRoot('c:/hello', true)
      assertHasRoot('z:/hello', true)
      assertHasRoot('A:/hello', true)
      assertHasRoot('C:/hello', true)
      assertHasRoot('Z:/hello', true)
      assertHasRoot('C:\\', true)
      assertHasRoot('C:\\hello', true)

      // Relative drive root
      assertHasRoot('C:', true)
      assertHasRoot('C:hello', true)
      assertHasRoot('C:hello/world', true)
      assertHasRoot('C:hello\\world', true)

      // Current drive root
      assertHasRoot('/', true)
      assertHasRoot('/hello', true)
      assertHasRoot('/hello/world', true)
      assertHasRoot('\\', true)
      assertHasRoot('\\hello', true)
      assertHasRoot('\\hello\\world', true)

      // UNC
      assertHasRoot('//machine/share', true)
      assertHasRoot('//machine/share/', true)
      assertHasRoot('//machine/share/hello', true)
      assertHasRoot('\\\\machine\\share', true)
      assertHasRoot('\\\\machine\\share\\', true)
      assertHasRoot('\\\\machine\\share\\hello', true)

      // Relative
      assertHasRoot('hello', false)
      assertHasRoot('hello/world', false)
      assertHasRoot('hello\\world', false)
    } else {
      // Root
      assertHasRoot('/', true)
      assertHasRoot('/hello', true)
      assertHasRoot('/hello/world', true)

      // Windows style drive root - false on OSX/Linux
      assertHasRoot('C:/', false)
      assertHasRoot('a:/hello', false)
      assertHasRoot('c:/hello', false)
      assertHasRoot('z:/hello', false)
      assertHasRoot('A:/hello', false)
      assertHasRoot('C:/hello', false)
      assertHasRoot('Z:/hello', false)
      assertHasRoot('C:\\', false)
      assertHasRoot('C:\\hello', false)

      // Windows style relative drive root - false on OSX/Linux
      assertHasRoot('C:', false)
      assertHasRoot('C:hello', false)
      assertHasRoot('C:hello/world', false)
      assertHasRoot('C:hello\\world', false)

      // Windows style current drive root - false on OSX/Linux
      assertHasRoot('\\', false)
      assertHasRoot('\\hello', false)
      assertHasRoot('\\hello\\world', false)

      // Windows style UNC - false on OSX/Linux
      assertHasRoot('\\\\machine\\share', false)
      assertHasRoot('\\\\machine\\share\\', false)
      assertHasRoot('\\\\machine\\share\\hello', false)

      // Relative
      assertHasRoot('hello', false)
      assertHasRoot('hello/world', false)
      assertHasRoot('hello\\world', false)
    }
  })

  it('normalizeSeparators normalizes slashes', () => {
    if (IS_WINDOWS) {
      // Drive-rooted
      assertNormalizeSeparators('C:/', 'C:\\')
      assertNormalizeSeparators('C:/hello', 'C:\\hello')
      assertNormalizeSeparators('C:/hello/', 'C:\\hello\\')
      assertNormalizeSeparators('C:\\', 'C:\\')
      assertNormalizeSeparators('C:\\hello', 'C:\\hello')
      assertNormalizeSeparators('C:', 'C:')
      assertNormalizeSeparators('C:hello', 'C:hello')
      assertNormalizeSeparators('C:hello/world', 'C:hello\\world')
      assertNormalizeSeparators('C:hello\\world', 'C:hello\\world')
      assertNormalizeSeparators('/', '\\')
      assertNormalizeSeparators('/hello', '\\hello')
      assertNormalizeSeparators('/hello/world', '\\hello\\world')
      assertNormalizeSeparators('/hello//world', '\\hello\\world')
      assertNormalizeSeparators('\\', '\\')
      assertNormalizeSeparators('\\hello', '\\hello')
      assertNormalizeSeparators('\\hello\\', '\\hello\\')
      assertNormalizeSeparators('\\hello\\world', '\\hello\\world')
      assertNormalizeSeparators('\\hello\\\\world', '\\hello\\world')

      // UNC
      assertNormalizeSeparators('//machine/share', '\\\\machine\\share')
      assertNormalizeSeparators('//machine/share/', '\\\\machine\\share\\')
      assertNormalizeSeparators(
        '//machine/share/hello',
        '\\\\machine\\share\\hello'
      )
      assertNormalizeSeparators('///machine/share', '\\\\machine\\share')
      assertNormalizeSeparators('\\\\machine\\share', '\\\\machine\\share')
      assertNormalizeSeparators('\\\\machine\\share\\', '\\\\machine\\share\\')
      assertNormalizeSeparators(
        '\\\\machine\\share\\hello',
        '\\\\machine\\share\\hello'
      )
      assertNormalizeSeparators('\\\\\\machine\\share', '\\\\machine\\share')

      // Relative
      assertNormalizeSeparators('hello', 'hello')
      assertNormalizeSeparators('hello/world', 'hello\\world')
      assertNormalizeSeparators('hello//world', 'hello\\world')
      assertNormalizeSeparators('hello\\world', 'hello\\world')
      assertNormalizeSeparators('hello\\\\world', 'hello\\world')
    } else {
      // Rooted
      assertNormalizeSeparators('/', '/')
      assertNormalizeSeparators('/hello', '/hello')
      assertNormalizeSeparators('/hello/world', '/hello/world')
      assertNormalizeSeparators('//hello/world/', '/hello/world/')

      // Backslash not converted
      assertNormalizeSeparators('C:\\', 'C:\\')
      assertNormalizeSeparators('C:\\\\hello\\\\', 'C:\\\\hello\\\\')
      assertNormalizeSeparators('\\', '\\')
      assertNormalizeSeparators('\\hello', '\\hello')
      assertNormalizeSeparators('\\hello\\world', '\\hello\\world')
      assertNormalizeSeparators('hello\\world', 'hello\\world')

      // UNC not converted
      assertNormalizeSeparators('\\\\machine\\share', '\\\\machine\\share')

      // UNC not preserved
      assertNormalizeSeparators('//machine/share', '/machine/share')

      // Relative
      assertNormalizeSeparators('hello', 'hello')
      assertNormalizeSeparators('hello/////world', 'hello/world')
    }
  })

  it('safeTrimTrailingSeparator safely trims trailing separator', () => {
    assertSafeTrimTrailingSeparator('', '')

    if (IS_WINDOWS) {
      // Removes redundant slashes
      assertSafeTrimTrailingSeparator(
        'C:\\\\hello\\\\\\world\\\\',
        'C:\\hello\\world'
      )
      assertSafeTrimTrailingSeparator('C://hello///world//', 'C:\\hello\\world')
      // Relative root:
      assertSafeTrimTrailingSeparator(
        '\\hello\\\\world\\\\again\\\\',
        '\\hello\\world\\again'
      )
      assertSafeTrimTrailingSeparator(
        '/hello///world//again//',
        '\\hello\\world\\again'
      )
      // UNC:
      assertSafeTrimTrailingSeparator('\\\\hello\\world\\', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator(
        '\\\\hello\\world\\\\',
        '\\\\hello\\world'
      )
      assertSafeTrimTrailingSeparator(
        '\\\\hello\\\\\\world\\\\again\\',
        '\\\\hello\\world\\again'
      )
      assertSafeTrimTrailingSeparator('//hello/world/', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('//hello/world//', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator(
        '//hello//world//again/',
        '\\\\hello\\world\\again'
      )
      // Relative:
      assertSafeTrimTrailingSeparator('hello\\world\\', 'hello\\world')

      // Slash trimming
      assertSafeTrimTrailingSeparator('a:/hello/', 'a:\\hello')
      assertSafeTrimTrailingSeparator('z:/hello', 'z:\\hello')
      assertSafeTrimTrailingSeparator('C:/', 'C:\\')
      assertSafeTrimTrailingSeparator('C:\\', 'C:\\')
      assertSafeTrimTrailingSeparator('C:/hello/world', 'C:\\hello\\world')
      assertSafeTrimTrailingSeparator('C:/hello/world/', 'C:\\hello\\world')
      assertSafeTrimTrailingSeparator('C:', 'C:')
      assertSafeTrimTrailingSeparator('C:hello/', 'C:hello')
      assertSafeTrimTrailingSeparator('/', '\\')
      assertSafeTrimTrailingSeparator('/hello/', '\\hello')
      assertSafeTrimTrailingSeparator('\\', '\\')
      assertSafeTrimTrailingSeparator('\\hello\\', '\\hello')
      assertSafeTrimTrailingSeparator('//hello/', '\\\\hello')
      assertSafeTrimTrailingSeparator('//hello/world', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('//hello/world/', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('\\\\hello', '\\\\hello')
      assertSafeTrimTrailingSeparator('\\\\hello\\', '\\\\hello')
      assertSafeTrimTrailingSeparator('\\\\hello\\world', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('\\\\hello\\world\\', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('hello/world/', 'hello\\world')
      assertSafeTrimTrailingSeparator('hello/', 'hello')
      assertSafeTrimTrailingSeparator('../../', '..\\..')
    } else {
      // Should not converts slashes
      assertSafeTrimTrailingSeparator('/hello\\world', '/hello\\world')
      assertSafeTrimTrailingSeparator('/hello\\world/', '/hello\\world')
      assertSafeTrimTrailingSeparator('\\\\hello\\world/', '\\\\hello\\world')
      assertSafeTrimTrailingSeparator('hello\\world/', 'hello\\world')

      // Should remove redundant slashes (rooted paths; UNC format not special)
      assertSafeTrimTrailingSeparator('//hello', '/hello')
      assertSafeTrimTrailingSeparator('//hello/world', '/hello/world')
      assertSafeTrimTrailingSeparator('//hello/world/', '/hello/world')
      assertSafeTrimTrailingSeparator('//hello//world//', '/hello/world')
      assertSafeTrimTrailingSeparator('///hello////world///', '/hello/world')

      // Should remove redundant slashes (relative paths)
      assertSafeTrimTrailingSeparator('hello//world//', 'hello/world')
      assertSafeTrimTrailingSeparator('hello///world///', 'hello/world')

      // Slash trimming (Windows drive root format not special)
      assertSafeTrimTrailingSeparator('C:/', 'C:')
      assertSafeTrimTrailingSeparator('C:/hello', 'C:/hello')
      assertSafeTrimTrailingSeparator('C:/hello/', 'C:/hello')
      assertSafeTrimTrailingSeparator('C:hello/', 'C:hello')

      // Slash trimming (rooted paths)
      assertSafeTrimTrailingSeparator('/', '/')
      assertSafeTrimTrailingSeparator('/hello', '/hello')
      assertSafeTrimTrailingSeparator('/hello/', '/hello')
      assertSafeTrimTrailingSeparator('/hello/world/', '/hello/world')

      // Slash trimming (relative paths)
      assertSafeTrimTrailingSeparator('hello/world/', 'hello/world')
      assertSafeTrimTrailingSeparator('../../', '../..')
    }
  })
})

function assertDirectoryName(itemPath: string, expected: string): void {
  expect(pathHelper.dirname(itemPath)).toBe(expected)
}

function assertEnsureAbsoluteRoot(
  root: string,
  itemPath: string,
  expected: string
): void {
  expect(pathHelper.ensureAbsoluteRoot(root, itemPath)).toBe(expected)
}

function assertHasAbsoluteRoot(itemPath: string, expected: boolean): void {
  expect(pathHelper.hasAbsoluteRoot(itemPath)).toBe(expected)
}

function assertHasRoot(itemPath: string, expected: boolean): void {
  expect(pathHelper.hasRoot(itemPath)).toBe(expected)
}

function assertNormalizeSeparators(itemPath: string, expected: string): void {
  expect(pathHelper.normalizeSeparators(itemPath)).toBe(expected)
}

function assertSafeTrimTrailingSeparator(
  itemPath: string,
  expected: string
): void {
  expect(pathHelper.safeTrimTrailingSeparator(itemPath)).toBe(expected)
}
