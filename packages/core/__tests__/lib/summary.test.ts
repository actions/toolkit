import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {afterAll, beforeEach, describe, expect, test} from 'vitest'

import {summary, SUMMARY_ENV_VAR} from '../../src/lib/summary.js'
import {TEST_DIRECTORY_PATH} from '../helpers/constants.js'

const TEST_FILE_PATH = path.join(TEST_DIRECTORY_PATH, 'test-summary.md')

async function assertSummary(expected: string): Promise<void> {
  const file = await fs.promises.readFile(TEST_FILE_PATH, {encoding: 'utf8'})
  expect(file).toStrictEqual(expected)
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

describe('summary', () => {
  beforeEach(async () => {
    process.env[SUMMARY_ENV_VAR] = TEST_FILE_PATH
    await fs.promises.mkdir(TEST_DIRECTORY_PATH, {recursive: true})
    await fs.promises.writeFile(TEST_FILE_PATH, '', {encoding: 'utf8'})
    summary.emptyBuffer()
  })

  afterAll(async () => {
    await fs.promises.unlink(TEST_FILE_PATH)
  })

  test('throws if summary env var is undefined', async () => {
    expect.assertions(1)
    process.env[SUMMARY_ENV_VAR] = undefined
    const write = summary.addRaw(fixtures.text).write()

    await expect(write).rejects.toThrow(
      `Unable to find environment variable for $GITHUB_STEP_SUMMARY. Check if your runtime environment supports job summaries.`
    )
  })

  test('throws if summary file does not exist', async () => {
    expect.assertions(1)

    await fs.promises.unlink(TEST_FILE_PATH)
    const write = summary.addRaw(fixtures.text).write()

    await expect(write).rejects.toThrow('b')
  })

  test('appends text to summary file', async () => {
    expect.assertions(1)

    await fs.promises.writeFile(TEST_FILE_PATH, '# ', {encoding: 'utf8'})
    await summary.addRaw(fixtures.text).write()
    await assertSummary(`# ${fixtures.text}`)
  })

  test('overwrites text to summary file', async () => {
    expect.assertions(1)

    await fs.promises.writeFile(TEST_FILE_PATH, 'overwrite', {encoding: 'utf8'})
    await summary.addRaw(fixtures.text).write({overwrite: true})
    await assertSummary(fixtures.text)
  })

  test('appends text with EOL to summary file', async () => {
    expect.assertions(1)

    await fs.promises.writeFile(TEST_FILE_PATH, '# ', {encoding: 'utf8'})
    await summary.addRaw(fixtures.text, true).write()
    await assertSummary(`# ${fixtures.text}${os.EOL}`)
  })

  test('chains appends text to summary file', async () => {
    expect.assertions(1)

    await fs.promises.writeFile(TEST_FILE_PATH, '', {encoding: 'utf8'})
    await summary
      .addRaw(fixtures.text)
      .addRaw(fixtures.text)
      .addRaw(fixtures.text)
      .write()
    await assertSummary([fixtures.text, fixtures.text, fixtures.text].join(''))
  })

  test('empties buffer after write', async () => {
    expect.assertions(2)

    await fs.promises.writeFile(TEST_FILE_PATH, '', {encoding: 'utf8'})
    await summary.addRaw(fixtures.text).write()
    await assertSummary(fixtures.text)
    expect(summary.isEmptyBuffer()).toBeTruthy()
  })

  test('returns summary buffer as string', () => {
    expect.assertions(1)

    summary.addRaw(fixtures.text)
    expect(summary.stringify()).toStrictEqual(fixtures.text)
  })

  test('return correct values for isEmptyBuffer', () => {
    expect.assertions(2)

    summary.addRaw(fixtures.text)
    expect(summary.isEmptyBuffer()).toBeFalsy()

    summary.emptyBuffer()
    expect(summary.isEmptyBuffer()).toBeTruthy()
  })

  test('clears a buffer and summary file', async () => {
    expect.assertions(2)

    await fs.promises.writeFile(TEST_FILE_PATH, 'content', {encoding: 'utf8'})
    await summary.clear()
    await assertSummary('')
    expect(summary.isEmptyBuffer()).toBeTruthy()
  })

  test('adds EOL', async () => {
    expect.assertions(1)

    await summary.addRaw(fixtures.text).addEOL().write()
    await assertSummary(fixtures.text + os.EOL)
  })

  test('adds a code block without language', async () => {
    expect.assertions(1)

    await summary.addCodeBlock(fixtures.code).write()
    const expected = `<pre><code>func fork() {\n  for {\n    go fork()\n  }\n}</code></pre>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a code block with a language', async () => {
    expect.assertions(1)

    await summary.addCodeBlock(fixtures.code, 'go').write()
    const expected = `<pre lang="go"><code>func fork() {\n  for {\n    go fork()\n  }\n}</code></pre>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds an unordered list', async () => {
    expect.assertions(1)

    await summary.addList(fixtures.list).write()
    const expected = `<ul><li>foo</li><li>bar</li><li>baz</li><li>💣</li></ul>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds an ordered list', async () => {
    expect.assertions(1)

    await summary.addList(fixtures.list, true).write()
    const expected = `<ol><li>foo</li><li>bar</li><li>baz</li><li>💣</li></ol>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a table', async () => {
    expect.assertions(1)

    await summary.addTable(fixtures.table).write()
    const expected = `<table><tr><th>foo</th><th>bar</th><th>baz</th><td rowspan="3">tall</td></tr><tr><td>one</td><td>two</td><td>three</td></tr><tr><td colspan="3">wide</td></tr></table>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a details element', async () => {
    expect.assertions(1)

    await summary
      .addDetails(fixtures.details.label, fixtures.details.content)
      .write()
    const expected = `<details><summary>open me</summary>🎉 surprise</details>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds an image with alt text', async () => {
    expect.assertions(1)

    await summary.addImage(fixtures.img.src, fixtures.img.alt).write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo">${os.EOL}`
    await assertSummary(expected)
  })

  test('adds an image with custom dimensions', async () => {
    expect.assertions(1)

    await summary
      .addImage(fixtures.img.src, fixtures.img.alt, fixtures.img.options)
      .write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo" width="32" height="32">${os.EOL}`
    await assertSummary(expected)
  })

  test('adds an image with custom dimensions', async () => {
    expect.assertions(1)

    await summary
      .addImage(fixtures.img.src, fixtures.img.alt, fixtures.img.options)
      .write()
    const expected = `<img src="https://github.com/actions.png" alt="actions logo" width="32" height="32">${os.EOL}`
    await assertSummary(expected)
  })

  test('adds headings h1...h6', async () => {
    expect.assertions(1)

    for (const i of [1, 2, 3, 4, 5, 6]) {
      summary.addHeading('heading', i)
    }
    await summary.write()
    const expected = `<h1>heading</h1>${os.EOL}<h2>heading</h2>${os.EOL}<h3>heading</h3>${os.EOL}<h4>heading</h4>${os.EOL}<h5>heading</h5>${os.EOL}<h6>heading</h6>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds h1 if heading level not specified', async () => {
    expect.assertions(1)

    await summary.addHeading('heading').write()
    const expected = `<h1>heading</h1>${os.EOL}`
    await assertSummary(expected)
  })

  test('uses h1 if heading level is garbage or out of range', async () => {
    expect.assertions(1)

    await summary
      .addHeading('heading', 'foobar')
      .addHeading('heading', 1337)
      .addHeading('heading', -1)
      .addHeading('heading', Number.POSITIVE_INFINITY)
      .write()
    const expected = `<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}<h1>heading</h1>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a separator', async () => {
    expect.assertions(1)

    await summary.addSeparator().write()
    const expected = `<hr>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a break', async () => {
    expect.assertions(1)

    await summary.addBreak().write()
    const expected = `<br>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a quote', async () => {
    expect.assertions(1)

    await summary.addQuote(fixtures.quote.text).write()
    const expected = `<blockquote>Where the world builds software</blockquote>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a quote with citation', async () => {
    expect.assertions(1)

    await summary.addQuote(fixtures.quote.text, fixtures.quote.cite).write()
    const expected = `<blockquote cite="https://github.com/about">Where the world builds software</blockquote>${os.EOL}`
    await assertSummary(expected)
  })

  test('adds a link with href', async () => {
    expect.assertions(1)

    await summary.addLink(fixtures.link.text, fixtures.link.href).write()
    const expected = `<a href="https://github.com/">GitHub</a>${os.EOL}`
    await assertSummary(expected)
  })
})
