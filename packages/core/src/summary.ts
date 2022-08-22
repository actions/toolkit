import {EOL} from 'os'
import {constants, promises} from 'fs'
const {access, appendFile, writeFile} = promises

export const SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY'
export const SUMMARY_DOCS_URL =
  'https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary'

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

export interface SummaryWriteOptions {
  /**
   * Replace all existing content in summary file with buffer contents
   * (optional) default: false
   */
  overwrite?: boolean
}

class Summary {
  private _buffer: string
  private _filePath?: string

  constructor() {
    this._buffer = ''
  }

  /**
   * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
   * Also checks r/w permissions.
   *
   * @returns step summary file path
   */
  private async filePath(): Promise<string> {
    if (this._filePath) {
      return this._filePath
    }

    const pathFromEnv = process.env[SUMMARY_ENV_VAR]
    if (!pathFromEnv) {
      throw new Error(
        `Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`
      )
    }

    try {
      await access(pathFromEnv, constants.R_OK | constants.W_OK)
    } catch {
      throw new Error(
        `Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`
      )
    }

    this._filePath = pathFromEnv
    return this._filePath
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
   * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
   *
   * @param {SummaryWriteOptions} [options] (optional) options for write operation
   *
   * @returns {Promise<Summary>} summary instance
   */
  async write(options?: SummaryWriteOptions): Promise<Summary> {
    const overwrite = !!options?.overwrite
    const filePath = await this.filePath()
    const writeFunc = overwrite ? writeFile : appendFile
    await writeFunc(filePath, this._buffer, {encoding: 'utf8'})
    return this.emptyBuffer()
  }

  /**
   * Clears the summary buffer and wipes the summary file
   *
   * @returns {Summary} summary instance
   */
  async clear(): Promise<Summary> {
    return this.emptyBuffer().write({overwrite: true})
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
   * Resets the summary buffer without writing to summary file
   *
   * @returns {Summary} summary instance
   */
  emptyBuffer(): Summary {
    this._buffer = ''
    return this
  }

  /**
   * Adds raw text to the summary buffer
   *
   * @param {string} text content to add
   * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
   *
   * @returns {Summary} summary instance
   */
  addRaw(text: string, addEOL = false): Summary {
    this._buffer += text
    return addEOL ? this.addEOL() : this
  }

  /**
   * Adds the operating system-specific end-of-line marker to the buffer
   *
   * @returns {Summary} summary instance
   */
  addEOL(): Summary {
    return this.addRaw(EOL)
  }

  /**
   * Adds an HTML codeblock to the summary buffer
   *
   * @param {string} code content to render within fenced code block
   * @param {string} lang (optional) language to syntax highlight code
   *
   * @returns {Summary} summary instance
   */
  addCodeBlock(code: string, lang?: string): Summary {
    const attrs = {
      ...(lang && {lang})
    }
    const element = this.wrap('pre', this.wrap('code', code), attrs)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML list to the summary buffer
   *
   * @param {string[]} items list of items to render
   * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
   *
   * @returns {Summary} summary instance
   */
  addList(items: string[], ordered = false): Summary {
    const tag = ordered ? 'ol' : 'ul'
    const listItems = items.map(item => this.wrap('li', item)).join('')
    const element = this.wrap(tag, listItems)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML table to the summary buffer
   *
   * @param {SummaryTableCell[]} rows table rows
   *
   * @returns {Summary} summary instance
   */
  addTable(rows: SummaryTableRow[]): Summary {
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
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds a collapsable HTML details element to the summary buffer
   *
   * @param {string} label text for the closed state
   * @param {string} content collapsable content
   *
   * @returns {Summary} summary instance
   */
  addDetails(label: string, content: string): Summary {
    const element = this.wrap('details', this.wrap('summary', label) + content)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML image tag to the summary buffer
   *
   * @param {string} src path to the image you to embed
   * @param {string} alt text description of the image
   * @param {SummaryImageOptions} options (optional) addition image attributes
   *
   * @returns {Summary} summary instance
   */
  addImage(src: string, alt: string, options?: SummaryImageOptions): Summary {
    const {width, height} = options || {}
    const attrs = {
      ...(width && {width}),
      ...(height && {height})
    }

    const element = this.wrap('img', null, {src, alt, ...attrs})
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML section heading element
   *
   * @param {string} text heading text
   * @param {number | string} [level=1] (optional) the heading level, default: 1
   *
   * @returns {Summary} summary instance
   */
  addHeading(text: string, level?: number | string): Summary {
    const tag = `h${level}`
    const allowedTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
      ? tag
      : 'h1'
    const element = this.wrap(allowedTag, text)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML thematic break (<hr>) to the summary buffer
   *
   * @returns {Summary} summary instance
   */
  addSeparator(): Summary {
    const element = this.wrap('hr', null)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML line break (<br>) to the summary buffer
   *
   * @returns {Summary} summary instance
   */
  addBreak(): Summary {
    const element = this.wrap('br', null)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML blockquote to the summary buffer
   *
   * @param {string} text quote text
   * @param {string} cite (optional) citation url
   *
   * @returns {Summary} summary instance
   */
  addQuote(text: string, cite?: string): Summary {
    const attrs = {
      ...(cite && {cite})
    }
    const element = this.wrap('blockquote', text, attrs)
    return this.addRaw(element).addEOL()
  }

  /**
   * Adds an HTML anchor tag to the summary buffer
   *
   * @param {string} text link text/content
   * @param {string} href hyperlink
   *
   * @returns {Summary} summary instance
   */
  addLink(text: string, href: string): Summary {
    const element = this.wrap('a', text, {href})
    return this.addRaw(element).addEOL()
  }
}

const _summary = new Summary()

/**
 * @deprecated use `core.summary`
 */
export const markdownSummary = _summary
export const summary = _summary
