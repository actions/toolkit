import CRC64 from '../src/internal/crc64'

const fixtures = {
  data:
    '🚀 👉😎👉 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  expected: 'D170FCD035F4D958'
}

describe('@actions/artifact/src/internal/crc64', () => {
  it('CRC64 from string', async () => {
    const crc = new CRC64()
    crc.update(fixtures.data)
    expect(crc.digest()).toEqual(fixtures.expected)
  })

  it('CRC64 from buffer', async () => {
    const crc = new CRC64()
    const buf = Buffer.from(fixtures.data)
    crc.update(buf)
    expect(crc.digest()).toEqual(fixtures.expected)
  })
})
