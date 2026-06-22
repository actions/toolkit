import {
  parsePaxLengthCorrect,
  crossCheckMetaBodies,
  PAX_KNOWN_KEYS
} from '../src/internal/pax-reparse'

/** Build a length-correct PAX record string for `<key>=<value>` content. */
function rec(content: string): string {
  const base = 1 + Buffer.byteLength(content) + 1 // space + content + LF
  let len = base + String(base).length
  if (String(len).length !== String(base).length) {
    len = base + String(len).length
  }
  return `${len} ${content}\n`
}

describe('parsePaxLengthCorrect', () => {
  test('single well-formed record', () => {
    const buf = Buffer.from('17 path=safe.txt\n', 'ascii')
    const {records, ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(true)
    expect(records['path'].toString('utf8')).toBe('safe.txt')
  })

  test('newline-in-value: the embedded fake record is swallowed by comment', () => {
    // An embedded-newline PAX body. A naive split('\n') parser (node-tar) ends
    // up with path=safe.txt; the length-correct parser must yield the real
    // (malicious) path and treat the rest as the comment value.
    const buf = Buffer.from(
      '42 path=../../../../../../tmp/escaped_pax\n30 comment=x\n17 path=safe.txt\n',
      'ascii'
    )
    const {records, ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(true)
    expect(records['path'].toString('utf8')).toBe(
      '../../../../../../tmp/escaped_pax'
    )
    expect(records['comment'].toString('utf8')).toBe('x\n17 path=safe.txt')
    // Crucially NOT safe.txt.
    expect(records['path'].toString('utf8')).not.toBe('safe.txt')
  })

  test('empty buffer parses to empty record set', () => {
    const {records, ok} = parsePaxLengthCorrect(Buffer.alloc(0))
    expect(ok).toBe(true)
    expect(Object.keys(records)).toHaveLength(0)
  })

  test('truncated record: not ok', () => {
    // length says 42 but the buffer is shorter
    const buf = Buffer.from('42 path=too-short\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('non-numeric length prefix: not ok', () => {
    const buf = Buffer.from('xx path=foo\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('missing trailing newline: not ok', () => {
    // "16 path=safe.txt" is 16 bytes but the last byte is 't', not '\n'
    const buf = Buffer.from('16 path=safe.txt', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('length spans past buffer end: not ok', () => {
    const buf = Buffer.from('99 path=x\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('record without "=" : not ok', () => {
    const buf = Buffer.from('10 nokeyval\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('record with correct length+LF but no "=" : not ok', () => {
    // "5 ab\n" is exactly 5 bytes and ends in LF, but has no '='. This
    // exercises the missing-separator branch (distinct from a length/LF
    // mismatch).
    const buf = Buffer.from('5 ab\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('value may itself contain "=" — only the first one is the separator', () => {
    const buf = Buffer.from(rec('comment=a=b=c'), 'ascii')
    const {records, ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(true)
    expect(records['comment'].toString('utf8')).toBe('a=b=c')
  })

  test('zero-length prefix is rejected', () => {
    const buf = Buffer.from('0 path=x\n', 'ascii')
    const {ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(false)
  })

  test('high-bit value bytes are preserved as raw Buffer', () => {
    const value = Buffer.from([0xc3, 0x28, 0xff]) // invalid utf8 on purpose
    const inner = Buffer.concat([Buffer.from('path=', 'ascii'), value])
    // record = "<len> " + inner + "\n"
    const base = 1 + inner.length + 1
    let len = base + String(base).length
    if (String(len).length !== String(base).length)
      len = base + String(len).length
    const buf = Buffer.concat([
      Buffer.from(`${len} `, 'ascii'),
      inner,
      Buffer.from('\n', 'ascii')
    ])
    const {records, ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(true)
    expect(Buffer.compare(records['path'], value)).toBe(0)
  })

  test('last write wins for repeated keys', () => {
    const buf = Buffer.from('14 path=a.txt\n14 path=b.txt\n', 'ascii')
    const {records, ok} = parsePaxLengthCorrect(buf)
    expect(ok).toBe(true)
    expect(records['path'].toString('utf8')).toBe('b.txt')
  })
})

describe('crossCheckMetaBodies', () => {
  test('clean PAX path matching node-tar: no violations', () => {
    const buf = Buffer.from('17 path=safe.txt\n', 'ascii')
    const v = crossCheckMetaBodies([buf], 'safe.txt', undefined)
    expect(v).toEqual([])
  })

  test('PAX path desync: node-tar resolved safe.txt, length-correct disagrees', () => {
    const buf = Buffer.from(
      '42 path=../../../../../../tmp/escaped_pax\n30 comment=x\n17 path=safe.txt\n',
      'ascii'
    )
    const v = crossCheckMetaBodies([buf], 'safe.txt', undefined)
    expect(v.map(x => x.code)).toContain('PAX_DESYNC')
  })

  test('PAX linkpath desync: node-tar resolved safe/target, length-correct disagrees', () => {
    const buf = Buffer.from(
      '34 linkpath=../../../../../../tmp\n37 comment=x\n24 linkpath=safe/target\n',
      'ascii'
    )
    const v = crossCheckMetaBodies([buf], 'cache/link', 'safe/target')
    expect(v.map(x => x.code)).toContain('PAX_DESYNC')
  })

  test('unknown PAX key is rejected', () => {
    const content = 'EVIL.placement=1'
    const base = 1 + content.length + 1
    let len = base + String(base).length
    if (String(len).length !== String(base).length)
      len = base + String(len).length
    const buf = Buffer.from(`${len} ${content}\n`, 'ascii')
    const v = crossCheckMetaBodies([buf], 'cache/x', undefined)
    expect(v.map(x => x.code)).toContain('PAX_UNKNOWN_KEY')
  })

  test('known SCHILY/LIBARCHIVE prefixed keys are accepted', () => {
    const records = [
      'SCHILY.xattr.user.foo=bar',
      'LIBARCHIVE.creationtime=1700000000'
    ]
    const body = records
      .map(content => {
        const base = 1 + content.length + 1
        let len = base + String(base).length
        if (String(len).length !== String(base).length)
          len = base + String(len).length
        return `${len} ${content}\n`
      })
      .join('')
    const v = crossCheckMetaBodies(
      [Buffer.from(body, 'ascii')],
      'cache/x',
      undefined
    )
    expect(v).toEqual([])
  })

  test('GNU.sparse.* keys are rejected as PAX_UNSUPPORTED_KEY', () => {
    // node-tar v7 does not process GNU sparse keys, so it surfaces the entry
    // under its header path while system tar would reconstruct the file at
    // `GNU.sparse.name` (here pointing outside the cache roots). The path /
    // linkpath cross-check cannot see this, so the sparse namespace must be
    // rejected outright even though it is under the broadly-allowed `GNU.`
    // prefix.
    const body = Buffer.from(
      rec('GNU.sparse.major=1') +
        rec('GNU.sparse.minor=0') +
        rec('GNU.sparse.name=../../../../tmp/evil') +
        rec('GNU.sparse.realsize=1024'),
      'ascii'
    )
    const v = crossCheckMetaBodies(
      [body],
      'cache/GNUSparseFile.0/decoy',
      undefined
    )
    expect(v.map(x => x.code)).toContain('PAX_UNSUPPORTED_KEY')
    // It must NOT also be misreported as merely an unknown key.
    expect(v.map(x => x.code)).not.toContain('PAX_UNKNOWN_KEY')
  })

  test('GNU long-name raw body matching entry path: no violation', () => {
    // A GNU LongName body is a raw NUL-terminated path with no length prefix.
    const raw = Buffer.concat([
      Buffer.from('cache/a/very/long/name.txt', 'ascii'),
      Buffer.from([0, 0])
    ])
    const v = crossCheckMetaBodies(
      [raw],
      'cache/a/very/long/name.txt',
      undefined
    )
    expect(v).toEqual([])
  })

  test('long-name body that matches neither path nor linkpath is flagged', () => {
    const raw = Buffer.from('something-unaccountable', 'ascii')
    const v = crossCheckMetaBodies([raw], 'cache/x', undefined)
    expect(v.map(x => x.code)).toContain('PAX_PARSE_FAIL')
  })

  test('no meta bodies: no violations', () => {
    expect(crossCheckMetaBodies([], 'cache/x', undefined)).toEqual([])
  })

  test('PAX setting both path and linkpath in agreement: no violations', () => {
    const body = Buffer.from(
      rec('path=cache/link') + rec('linkpath=cache/target'),
      'ascii'
    )
    const v = crossCheckMetaBodies([body], 'cache/link', 'cache/target')
    expect(v).toEqual([])
  })

  test('directory path with trailing slash compares equal (no false desync)', () => {
    // node-tar may resolve a directory entry without the trailing slash that
    // the PAX record carries; normalizeForCompare must treat them as equal.
    const body = Buffer.from(rec('path=cache/dir/'), 'ascii')
    const v = crossCheckMetaBodies([body], 'cache/dir', undefined)
    expect(v).toEqual([])
  })

  test('multiple PAX bodies merge with last-write-wins before comparison', () => {
    const bodies = [
      Buffer.from(rec('path=cache/first'), 'ascii'),
      Buffer.from(rec('path=cache/second'), 'ascii')
    ]
    // node-tar's resolved path is the last write; agreement => no violation.
    expect(crossCheckMetaBodies(bodies, 'cache/second', undefined)).toEqual([])
    // Disagreement with the merged (last) value => desync.
    expect(
      crossCheckMetaBodies(bodies, 'cache/first', undefined).map(x => x.code)
    ).toContain('PAX_DESYNC')
  })

  test('GNU long-name raw body matching the link target (not the path)', () => {
    const raw = Buffer.concat([
      Buffer.from('cache/sub/target', 'ascii'),
      Buffer.from([0])
    ])
    const v = crossCheckMetaBodies([raw], 'cache/link', 'cache/sub/target')
    expect(v).toEqual([])
  })

  test('PAX_KNOWN_KEYS includes path and linkpath', () => {
    expect(PAX_KNOWN_KEYS.has('path')).toBe(true)
    expect(PAX_KNOWN_KEYS.has('linkpath')).toBe(true)
  })
})
