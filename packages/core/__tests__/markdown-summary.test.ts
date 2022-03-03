import * as fs from 'fs'
import * as os from 'os'
import path from 'path'
import {
  markdownSummary,
  SUMMARY_ENV_VAR,
  SUMMARY_LIMIT_BYTES
} from '../src/markdown-summary'

const testFilePath = path.join(__dirname, 'test', 'test-summary.md')

async function assertSummary(expected: string): Promise<void> {
  const file = await fs.promises.readFile(testFilePath, {encoding: 'utf8'})
  expect(file).toEqual(expected)
}

const fixtures = {
  text: 'hello world 🌎',
  code: `func fork() {
  for {
    go fork()
  }
}`,
  list: ['foo', 'bar', 'baz', '💣'],
  table: [
    [
      {
        data: 'foo',
        header: true
      },
      {
        data: 'bar',
        header: true
      },
      {
        data: 'baz',
        header: true
      },
      {
        data: 'tall',
        rowspan: '3'
      }
    ],
    ['one', 'two', 'three'],
    [
      {
        data: 'wide',
        colspan: '3'
      }
    ]
  ],
  details: {
    label: 'open me',
    content: '🎉 surprise'
  },
  img: {
    src: 'https://github.com/actions.png',
    alt: 'actions logo',
    options: {
      width: '32',
      height: '32'
    }
  },
  quote: {
    text: 'Where the world builds software',
    cite: 'https://github.com/about'
  },
  link: {
    text: 'GitHub',
    href: 'https://github.com/'
  }
}

describe('@actions/core/src/markdown-summary', () => {
  beforeEach(async () => {
    process.env[SUMMARY_ENV_VAR] = testFilePath
    await fs.promises.writeFile(testFilePath, '', {encoding: 'utf8'})
    markdownSummary.emptyBuffer()
  })

  afterAll(async () => {
    await fs.promises.unlink(testFilePath)
  })

  it('throws if summary env var is undefined', async () => {
    process.env[SUMMARY_ENV_VAR] = undefined
    const write = markdownSummary.addRaw(fixtures.text).write()

    await expect(write).rejects.toThrow()
  })

  it('throws if summary file does not exist', async () => {
    await fs.promises.unlink(testFilePath)
    const write = markdownSummary.addRaw(fixtures.text).write()

    await expect(write).rejects.toThrow()
  })

  it('throws if write will exceed file limit', async () => {
    const aaa = 'a'.repeat(SUMMARY_LIMIT_BYTES + 1)
    const write = markdownSummary.addRaw(aaa).write()

    await expect(write).rejects.toThrow()
  })

  it('appends text to summary file', async () => {
    await fs.promises.writeFile(testFilePath, '# ', {encoding: 'utf8'})
    await markdownSummary.addRaw(fixtures.text).write()
    await assertSummary(`# ${fixtures.text}`)
  })

  it('overwrites text to summary file', async () => {
    await fs.promises.writeFile(testFilePath, 'overwrite', {encoding: 'utf8'})
    await markdownSummary.addRaw(fixtures.text).write(true)
    await assertSummary(fixtures.text)
  })

  it('appends text with EOL to summary file', async () => {
    await fs.promises.writeFile(testFilePath, '# ', {encoding: 'utf8'})
    await markdownSummary.addRaw(fixtures.text, true).write()
    await assertSummary(`# ${fixtures.text}${os.EOL}`)
  })

  it('chains appends text to summary file', async () => {
    await fs.promises.writeFile(testFilePath, '', {encoding: 'utf8'})
    await markdownSummary
      .addRaw(fixtures.text)
      .addRaw(fixtures.text)
      .addRaw(fixtures.text)
      .write()
    await assertSummary([fixtures.text, fixtures.text, fixtures.text].join(''))
  })

  it('empties buffer after write', async () => {
    await fs.promises.writeFile(testFilePath, '', {encoding: 'utf8'})
    await markdownSummary.addRaw(fixtures.text).write()
    await assertSummary(fixtures.text)
    expect(markdownSummary.isEmptyBuffer()).toBe(true)
  })

  it('returns summary buffer as string', () => {
    markdownSummary.addRaw(fixtures.text)
    expect(markdownSummary.stringify()).toEqual(fixtures.text)
  })

  it('return correct values for isEmptyBuffer', () => {
    markdownSummary.addRaw(fixtures.text)
    expect(markdownSummary.isEmptyBuffer()).toBe(false)

    markdownSummary.emptyBuffer()
    expect(markdownSummary.isEmptyBuffer()).toBe(true)
  })

  it('adds EOL', async () => {
    await markdownSummary
      .addRaw(fixtures.text)
      .addEOL()
      .write()
    await assertSummary(fixtures.text + os.EOL)
  })

  it('adds a code block without language', async () => {
    await markdownSummary.addCodeBlock(fixtures.code).write()
    const expected = `<pre><code>func fork() {\n  for {\n    go fork()\n  }\n}</code></pre>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a code block with a language', async () => {
    await markdownSummary.addCodeBlock(fixtures.code, 'go').write()
    const expected = `<pre lang="go"><code>func fork() {\n  for {\n    go fork()\n  }\n}</code></pre>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds an unordered list', async () => {
    await markdownSummary.addList(fixtures.list).write()
    const expected = `<ul><li>foo</li><li>bar</li><li>baz</li><li>💣</li></ul>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds an ordered list', async () => {
    await markdownSummary.addList(fixtures.list, true).write()
    const expected = `<ol><li>foo</li><li>bar</li><li>baz</li><li>💣</li></ol>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a table', async () => {
    await markdownSummary.addTable(fixtures.table).write()
    const expected = `<table><tr><th>foo</th><th>bar</th><th>baz</th><td rowspan="3">tall</td></tr><tr><td>one</td><td>two</td><td>three</td></tr><tr><td colspan="3">wide</td></tr></table>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a details element', async () => {
    await markdownSummary
      .addDetails(fixtures.details.label, fixtures.details.content)
      .write()
    const expected = `<details><summary>open me</summary>🎉 surprise</details>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds an image with alt text', async () => {
    await markdownSummary.addImage(fixtures.img.src, fixtures.img.alt).write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo">${os.EOL}`
    await assertSummary(expected)
  })

  it('adds an image with custom dimensions', async () => {
    await markdownSummary
      .addImage(fixtures.img.src, fixtures.img.alt, fixtures.img.options)
      .write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo" width="32" height="32">${os.EOL}`
    await assertSummary(expected)
  })

  it('adds an image with custom dimensions', async () => {
    await markdownSummary
      .addImage(fixtures.img.src, fixtures.img.alt, fixtures.img.options)
      .write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo" width="32" height="32">${os.EOL}`
    await assertSummary(expected)
  })

  it('adds headings h1...h6', async () => {
    for (const i of [1, 2, 3, 4, 5, 6]) {
      markdownSummary.addHeading('heading', i)
    }
    await markdownSummary.write()
    const expected = `<h1>heading</h1>${os.EOL}<h2>heading</h2>${os.EOL}<h3>heading</h3>${os.EOL}<h4>heading</h4>${os.EOL}<h5>heading</h5>${os.EOL}<h6>heading</h6>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds h1 if heading level not specified', async () => {
    await markdownSummary.addHeading('heading').write()
    const expected = `<h1>heading</h1>${os.EOL}`
    await assertSummary(expected)
  })

  it('uses h1 if heading level is garbage or out of range', async () => {
    await markdownSummary
      .addHeading('heading', 'foobar')
      .addHeading('heading', 1337)
      .addHeading('heading', -1)
      .addHeading('heading', Infinity)
      .write()
    const expected = `<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a separator', async () => {
    await markdownSummary.addSeparator().write()
    const expected = `<hr>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a break', async () => {
    await markdownSummary.addBreak().write()
    const expected = `<br>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a quote', async () => {
    await markdownSummary.addQuote(fixtures.quote.text).write()
    const expected = `<blockquote>Where the world builds software</blockquote>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a quote with citation', async () => {
    await markdownSummary
      .addQuote(fixtures.quote.text, fixtures.quote.cite)
      .write()
    const expected = `<blockquote cite="https://github.com/about">Where the world builds software</blockquote>${os.EOL}`
    await assertSummary(expected)
  })

  it('adds a link with href', async () => {
    await markdownSummary
      .addLink(fixtures.link.text, fixtures.link.href)
      .write()
    const expected = `<a href="https://github.com/">GitHub</a>${os.EOL}`
    await assertSummary(expected)
  })
})
