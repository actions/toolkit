import * as fs from 'fs'
import * as ioUtil from '../src/io-util.js'

describe('Unix executable group permissions', () => {
  const identityKeys = [
    'getuid',
    'getgid',
    'geteuid',
    'getegid',
    'getgroups'
  ] as const
  const originalDescriptors = identityKeys.map(key =>
    Object.getOwnPropertyDescriptor(process, key)
  )

  beforeEach(() => {
    jest.replaceProperty(ioUtil, 'IS_WINDOWS', false)
    Object.defineProperties(process, {
      getuid: {configurable: true, value: () => 1000},
      getgid: {configurable: true, value: () => 100},
      geteuid: {configurable: true, value: undefined},
      getegid: {configurable: true, value: undefined}
    })
  })

  afterEach(() => {
    for (const [index, key] of identityKeys.entries()) {
      const descriptor = originalDescriptors[index]
      if (descriptor) {
        Object.defineProperty(process, key, descriptor)
      } else {
        delete process[key]
      }
    }
    jest.restoreAllMocks()
  })

  it.each([
    {
      name: 'supplementary group',
      mode: 0o010,
      uid: 2000,
      gid: 200,
      groups: [200],
      executable: true
    },
    {
      name: 'later supplementary group',
      mode: 0o010,
      uid: 2000,
      gid: 200,
      groups: [100, 300, 200],
      executable: true
    },
    {
      name: 'primary group',
      mode: 0o010,
      uid: 2000,
      gid: 100,
      groups: [],
      executable: true
    },
    {
      name: 'unrelated group',
      mode: 0o010,
      uid: 2000,
      gid: 300,
      groups: [200],
      executable: false
    },
    {
      name: 'missing group execute bit',
      mode: 0o040,
      uid: 2000,
      gid: 200,
      groups: [200],
      executable: false
    },
    {
      name: 'owner execute bit',
      mode: 0o100,
      uid: 1000,
      gid: 300,
      groups: [],
      executable: true
    },
    {
      name: 'other execute bit',
      mode: 0o001,
      uid: 2000,
      gid: 300,
      groups: [],
      executable: true
    },
    {
      name: 'primary group without getgroups',
      mode: 0o010,
      uid: 2000,
      gid: 100,
      groups: undefined,
      executable: true
    },
    {
      name: 'unrelated group without getgroups',
      mode: 0o010,
      uid: 2000,
      gid: 200,
      groups: undefined,
      executable: false
    }
  ])('$name', async ({mode, uid, gid, groups, executable}) => {
    Object.defineProperty(process, 'getgroups', {
      configurable: true,
      value: groups === undefined ? undefined : () => groups
    })
    jest.spyOn(ioUtil, 'stat').mockResolvedValue({
      mode,
      uid,
      gid,
      isFile: () => true
    } as fs.Stats)

    expect(await ioUtil.tryGetExecutablePath('/tool', [])).toBe(
      executable ? '/tool' : ''
    )
  })

  it('checks supplementary groups when trying an extension', async () => {
    Object.defineProperty(process, 'getgroups', {
      configurable: true,
      value: () => [200]
    })
    jest
      .spyOn(ioUtil, 'stat')
      .mockRejectedValueOnce(
        Object.assign(new Error('Missing'), {code: 'ENOENT'})
      )
      .mockResolvedValue({
        mode: 0o010,
        uid: 2000,
        gid: 200,
        isFile: () => true
      } as fs.Stats)

    expect(await ioUtil.tryGetExecutablePath('/tool', ['.sh'])).toBe('/tool.sh')
  })

  it.each([
    {
      name: 'owner permissions override group and other',
      uid: 1000,
      gid: 200,
      mode: 0o011
    },
    {
      name: 'primary group permissions override other',
      uid: 2000,
      gid: 100,
      mode: 0o001
    },
    {
      name: 'supplementary group permissions override other',
      uid: 2000,
      gid: 200,
      mode: 0o001
    }
  ])('$name', async ({uid, gid, mode}) => {
    Object.defineProperty(process, 'getgroups', {
      configurable: true,
      value: () => [200]
    })
    jest.spyOn(ioUtil, 'stat').mockResolvedValue({
      mode,
      uid,
      gid,
      isFile: () => true
    } as fs.Stats)

    expect(await ioUtil.tryGetExecutablePath('/tool', [])).toBe('')
  })

  it.each([0o000, 0o001, 0o010, 0o100])('root with mode %i', async mode => {
    Object.defineProperties(process, {
      getuid: {configurable: true, value: () => 0},
      getgroups: {configurable: true, value: () => []}
    })
    jest.spyOn(ioUtil, 'stat').mockResolvedValue({
      mode,
      uid: 2000,
      gid: 300,
      isFile: () => true
    } as fs.Stats)

    expect(await ioUtil.tryGetExecutablePath('/tool', [])).toBe(
      mode === 0 ? '' : '/tool'
    )
  })

  it.each([
    {
      name: 'effective owner',
      realUid: 1000,
      effectiveUid: 2000,
      effectiveGid: 100,
      mode: 0o100,
      executable: true
    },
    {
      name: 'effective group',
      realUid: 1000,
      effectiveUid: 1000,
      effectiveGid: 300,
      mode: 0o010,
      executable: true
    },
    {
      name: 'unprivileged effective user with real uid zero',
      realUid: 0,
      effectiveUid: 1000,
      effectiveGid: 100,
      mode: 0o100,
      executable: false
    }
  ])(
    '$name',
    async ({realUid, effectiveUid, effectiveGid, mode, executable}) => {
      Object.defineProperties(process, {
        getuid: {configurable: true, value: () => realUid},
        geteuid: {configurable: true, value: () => effectiveUid},
        getegid: {configurable: true, value: () => effectiveGid},
        getgroups: {configurable: true, value: () => []}
      })
      jest.spyOn(ioUtil, 'stat').mockResolvedValue({
        mode,
        uid: 2000,
        gid: 300,
        isFile: () => true
      } as fs.Stats)

      expect(await ioUtil.tryGetExecutablePath('/tool', [])).toBe(
        executable ? '/tool' : ''
      )
    }
  )
})
