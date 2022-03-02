import {EOL} from 'os'
import {constants, promises} from 'fs'
const {access, appendFile, writeFile} = promises

export const SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY'

export type SummaryTableRow = (SummaryTableCell | string)[]
export interface SummaryTableCell {
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

export interface SummaryImageOptions {
  /**
   * The width of the image in pixels. Must be an integer without a unit.
   * (optional)
   */
  width?: string
  /**
   * The height of the image in pixels. Must be an integer without a unit.
   * (optional)
   */
  height?: string
}

class MarkdownSummary {
  private _buffer: string

  constructor() {
    this._buffer = ''
  }

  /**
   * Finds the summary file path from the environment, rejects if not found
   *
   * @returns step summary file path
   */
  private async filePath(): Promise<string> {
    const filePath = process.env[SUMMARY_ENV_VAR]
    if (!filePath) {
      throw new Error(
        `Unable to find environment variable for $${SUMMARY_ENV_VAR}`
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
   * Wraps content in an HTML tag, adding any HTML attributes
   *
   * @param {string} tag HTML tag to wrap
   * @param {string | null} content content within the tag
   * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
   *
   * @returns {string} content wrapped in HTML element
   */
  private wrap(
    tag: string,
    content: string | null,
    attrs: {[attribute: string]: string} = {}
  ): string {
    const htmlAttrs = Object.entries(attrs)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('')

    if (!content) {
      return `<${tag}${htmlAttrs}>`
    }

    return `<${tag}${htmlAttrs}>${content}</${tag}>`
  }

  /**
   * Writes text in the buffer to the summary buffer file, will append by default
   *
   * @param {boolean} [overwrite=false] (optional) replace existing content in summary file with buffer contents, default: false
   *
   * @returns {Promise<MarkdownSummary>} markdown summary instance
   */
  async write(overwrite = false): Promise<MarkdownSummary> {
    const filePath = await this.filePath()
    const writeFunc = overwrite ? writeFile : appendFile
    await writeFunc(filePath, this._buffer, {encoding: 'utf8'})
    return this.emptyBuffer()
  }

  /**
   * Returns the current summary buffer as a string
   *
   * @returns {string} string of summary buffer
   */
  stringify(): string {
    return this._buffer
  }

  /**
   * If the summary buffer is empty
   *
   * @returns {boolen} true if the buffer is empty
   */
  isEmptyBuffer(): boolean {
    return this._buffer.length === 0
  }

  /**
   * Clears the summary buffer without writing to summary file
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  emptyBuffer(): MarkdownSummary {
    this._buffer = ''
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
    this._buffer += text
    return this
  }

  /**
   * Adds the operating system-specific end-of-line marker to the buffer
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addEOL(): MarkdownSummary {
    return this.add(EOL)
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
    return this.add(element).addEOL()
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
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML table to the summary buffer
   *
   * @param {SummaryTableCell[]} rows table rows
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addTable(rows: SummaryTableRow[]): MarkdownSummary {
    const tableBody = rows
      .map(row => {
        const cells = row
          .map(cell => {
            if (typeof cell === 'string') {
              return this.wrap('td', cell)
            }

            const {header, data, colspan, rowspan} = cell
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
    return this.add(element).addEOL()
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
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML image tag to the summary buffer
   *
   * @param {string} src path to the image you to embed
   * @param {string} alt text description of the image
   * @param {SummaryImageOptions} options addition image attributes
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addImage(
    src: string,
    alt: string,
    options?: SummaryImageOptions
  ): MarkdownSummary {
    const {width, height} = options || {}
    const attrs = {
      ...(width && {width}),
      ...(height && {height})
    }

    const element = this.wrap('img', null, {src, alt, ...attrs})
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML section heading element
   *
   * @param {string} text heading text
   * @param {number | string} [level=1] (optional) the heading level, default: 1
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addHeading(text: string, level?: number | string): MarkdownSummary {
    const tag = `h${level}`
    const allowedTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
      ? tag
      : 'h1'
    const element = this.wrap(allowedTag, text)
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML thematic break (<hr>) to the summary buffer
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addSeparator(): MarkdownSummary {
    const element = this.wrap('hr', null)
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML line break (<br>) to the summary buffer
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addBreak(): MarkdownSummary {
    const element = this.wrap('br', null)
    return this.add(element).addEOL()
  }

  /**
   * Adds an HTML blockquote to the summary buffer
   *
   * @param {string} text quote text
   * @param {string} cite (optional) citation url
   *
   * @returns {MarkdownSummary} markdown summary instance
   */
  addQuote(text: string, cite?: string): MarkdownSummary {
    const attrs = {
      ...(cite && {cite})
    }
    const element = this.wrap('blockquote', text, attrs)
    return this.add(element).addEOL()
  }
}

// singleton export
export const markdownSummary = new MarkdownSummary()
