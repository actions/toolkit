import * as fs from 'fs'
import {promisify} from 'util'

const exists = promisify(fs.exists)
const appendFile = promisify(fs.appendFile)

export class MarkdownSummary {
  static ENV_VAR = 'GITHUB_STEP_SUMMARY'
  private buffer: string

  constructor() {
    this.buffer = ''
  }

  /**
   * Finds the summary file path from the environment, rejects if not found
   *
   * @returns step summary file path
   */
  private async filePath(): Promise<string> {
    const filePath = process.env[MarkdownSummary.ENV_VAR]
    if (!filePath) {
      throw new Error(
        `Unable to find environment variable for ${MarkdownSummary.ENV_VAR}`
      )
    }
    if (!(await exists(filePath))) {
      throw new Error(`Missing summary file at path: ${filePath}`)
    }

    return filePath
  }

  /**
   * Writes any text in the buffer to the summary file
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  async write(): Promise<MarkdownSummary> {
    const filePath = await this.filePath()
    await appendFile(filePath, this.buffer, {encoding: 'utf8'})
    this.clear()

    return this
  }

  /**
   * Clears the summary buffer without writing to summary file
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  clear(): MarkdownSummary {
    this.buffer = ''
    return this
  }

  /**
   * Adds a newline to the summary
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addNewline(): MarkdownSummary {
    this.buffer += '\n'
    return this
  }

  /**
   * Adds text to the summary
   * @param {string} text content to add
   * @param {boolean} [newline=false] whether or not to add a newline
   * @returns {MarkdownSummary} markdown summary instance
   */
  addText(text: string, newline = false): MarkdownSummary {
    this.buffer += text
    return newline ? this.addNewline() : this
  }

  /**
   * Adds a markdown codeblock to the summary
   *
   * @param {string} code content to render within fenced code block
   * @param {string} [language=''] optional language to syntax highlight code
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addCodeBlock(code: string, language = ''): MarkdownSummary {
    this.buffer += `\`\`\`${language}\n${code}\n\`\`\`\n`
    return this
  }

  /**
   * Adds an HTML list to the summary
   *
   * @param {string[]} items list of items to render
   * @param {boolean} [ordered=false] if the rendered list should be ordered or not (default: false)
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addList(items: string[], ordered = false): MarkdownSummary {
    const listType = `${ordered ? 'o' : 'u'}l`
    const listElems = items.map(e => `<li>${e}</li>\n`).join()
    this.buffer += `<${listType}>\n${listElems}</${listType}>\n`
    return this
  }

  /**
   * Adds an HTML list to the summary
   *
   * @param {{[key: string]: any}[]} rows list of data rows
   * @param {string[]} headers list of keys to use as headers
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addTable(rows: {[key: string]: any}[], headers: string[]): MarkdownSummary {
    const headerElems = headers.map(h => `<th>${h}</th>\n`).join()
    const rowElems = rows
      .map(row => {
        const data = headers.map(h => `<td>${row[h]}</td>\n`).join()
        return `<tr>${data}</tr>\n`
      })
      .join()
    this.buffer += `<table>\n<tr>${headerElems}</tr>\n${rowElems}</table>\n`
    return this
  }

  /**
   * Adds a collapsable HTML details element to the summary
   *
   * @param {string} label text for the closed state
   * @param {string} content collapsable content
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addDetails(label: string, content: string): MarkdownSummary {
    this.buffer += `<details><summary>${label}</summary>\n\n${content}</details>\n`
    return this
  }
}
