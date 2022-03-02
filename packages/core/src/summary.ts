import {constants, promises} from 'fs'
const {access, appendFile, writeFile} = promises

export interface TableCell {
  /**
   * Cell content
   */
  data: string
  /**
   * Render cell as header
   * (optional) default: false
   */
  header?: boolean
  /**
   * Number of columns the cell extends
   * (optional) default: '1'
   */
  colspan?: string
  /**
   * Number of rows the cell extends
   * (optional) default: '1'
   */
  rowspan?: string
}

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

    try {
      await access(filePath, constants.R_OK | constants.W_OK)
    } catch {
      throw new Error(`Unable to access summary file: ${filePath}`)
    }

    return filePath
  }

  /**
   * Wraps content in an html tag, adding any HTML attributes
   *
   * @param tag HTML tag to wrap
   * @param content content within the tag
   * @param attrs key value list of html attributes to add
   */
  private wrap(
    tag: string,
    content: string,
    attrs: {[key: string]: string} = {}
  ): string {
    const htmlAttrs = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    return `<${tag}${htmlAttrs && htmlAttrs.padStart(1)}>${content}</${tag}>`
  }

  /**
   * Writes text in the buffer to the summary buffer file, will append by default
   *
   * @param {boolean} [overwrite=false] (optional) replace existing content in summary file with buffer contents, default: false
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  async write(overwrite = false): Promise<MarkdownSummary> {
    const filePath = await this.filePath()
    const writeFunc = overwrite ? writeFile : appendFile
    await writeFunc(filePath, this.buffer, {encoding: 'utf8'})
    return this.clearBuffer()
  }

  /**
   * If the summary buffer is empty
   *
   * @returns {boolen} true if the buffer is empty
   */
  isEmptyBuffer(): boolean {
    return this.buffer.length === 0
  }

  /**
   * Clears the summary buffer without writing to summary file
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  clearBuffer(): MarkdownSummary {
    this.buffer = ''
    return this
  }

  /**
   * Adds a newline to the summary buffer
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addNewline(): MarkdownSummary {
    this.buffer += '\n'
    return this
  }

  /**
   * Adds raw text to the summary buffer
   *
   * @param {string} text content to add
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  add(text: string): MarkdownSummary {
    this.buffer += text
    return this
  }

  /**
   * Adds an HTML codeblock to the summary buffer
   *
   * @param {string} code content to render within fenced code block
   * @param {string} lang (optional) language to syntax highlight code
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addCodeBlock(code: string, lang?: string): MarkdownSummary {
    const attrs = {
      ...(lang && {lang})
    }
    const element = this.wrap('pre', this.wrap('code', code), attrs)
    return this.add(element).addNewline()
  }

  /**
   * Adds an HTML list to the summary buffer
   *
   * @param {string[]} items list of items to render
   * @param {boolean} [ordered=false] if the rendered list should be ordered or not (default: false)
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addList(items: string[], ordered = false): MarkdownSummary {
    const tag = ordered ? 'ol' : 'ul'
    const listItems = items.map(item => this.wrap('li', item)).join('')
    const element = this.wrap(tag, listItems)
    return this.add(element).addNewline()
  }

  /**
   * Adds an HTML table to the summary buffer
   *
   * @param {TableCell[]} rows table rows
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addTable(rows: TableCell[][]): MarkdownSummary {
    const tableBody = rows
      .map(row => {
        const cells = row
          .map(({header, data, colspan, rowspan}) => {
            const tag = header ? 'th' : 'td'
            const attrs = {
              ...(colspan && {colspan}),
              ...(rowspan && {rowspan})
            }

            return this.wrap(tag, data, attrs)
          })
          .join('')

        return this.wrap('tr', cells)
      })
      .join('')

    const element = this.wrap('table', tableBody)
    return this.add(element).addNewline()
  }

  /**
   * Adds a collapsable HTML details element to the summary buffer
   *
   * @param {string} label text for the closed state
   * @param {string} content collapsable content
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addDetails(label: string, content: string): MarkdownSummary {
    const element = this.wrap('details', this.wrap('summary', label) + content)
    return this.add(element).addNewline()
  }
}
