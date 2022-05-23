import CRC64, {CRC64DigestEncoding} from '../src/internal/crc64'

const fixtures = {
  data:
    '🚀 👉😎👉 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n',
  expected: {
    hex: '846CE4ADAD6223ED',
    base64: '7SNira3kbIQ=',
    buffer: Buffer.from([0xed, 0x23, 0x62, 0xad, 0xad, 0xe4, 0x6c, 0x84])
  }
}

function assertEncodings(crc: CRC64): void {
  const encodings = Object.keys(fixtures.expected) as CRC64DigestEncoding[]
  for (const encoding of encodings) {
    expect(crc.digest(encoding)).toEqual(fixtures.expected[encoding])
  }
}

describe('@actions/artifact/src/internal/crc64', () => {
  it('CRC64 from string', async () => {
    const crc = new CRC64()
    crc.update(fixtures.data)

    assertEncodings(crc)
  })

  it('CRC64 from buffer', async () => {
    const crc = new CRC64()
    const buf = Buffer.from(fixtures.data)
    crc.update(buf)

    assertEncodings(crc)
  })

  it('CRC64 from split data', async () => {
    const crc = new CRC64()
    const splits = fixtures.data.split('\n').slice(0, -1)
    for (const split of splits) {
      crc.update(`${split}\n`)
    }

    assertEncodings(crc)
  })

  it('flips 64 bits', async () => {
    const tests = [
      [BigInt(0), BigInt('0xffffffffffffffff')],
      [BigInt('0xffffffffffffffff'), BigInt(0)],
      [BigInt('0xdeadbeef'), BigInt('0xffffffff21524110')]
    ]

    for (const [input, expected] of tests) {
      expect(CRC64.flip64Bits(input)).toEqual(expected)
    }
  })
})
