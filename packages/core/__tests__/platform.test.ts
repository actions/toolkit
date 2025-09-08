import os from 'os'
import {platform} from '../src/index'

describe('getInfo', () => {
  it('returns the platform info', async () => {
    const info = await platform.getDetails()
    expect(info).toEqual({
      name: expect.any(String),
      platform: expect.any(String),
      arch: expect.any(String),
      version: expect.any(String),
      isWindows: expect.any(Boolean),
      isMacOS: expect.any(Boolean),
      isLinux: expect.any(Boolean)
    })
  })

  it('returns the platform info with the correct name', async () => {
    const isWindows = os.platform() === 'win32'
    const isMacOS = os.platform() === 'darwin'
    const isLinux = os.platform() === 'linux'

    const info = await platform.getDetails()
    expect(info.platform).toEqual(os.platform())
    expect(info.isWindows).toEqual(isWindows)
    expect(info.isMacOS).toEqual(isMacOS)
    expect(info.isLinux).toEqual(isLinux)
  })
})
