/**
 * GFM pipe tables, kept in one canonical shape: `| a | b |`, with a delimiter
 * row directly under the header. Everything the editor writes goes through
 * `formatTable`, so a table's source stays predictable no matter how it was
 * edited — which is what lets the editor hide the pipes and draw a grid.
 */

export type TableAlign = 'none' | 'left' | 'center' | 'right'

export interface CellRange {
  from: number
  to: number
}

export interface RowLayout {
  /** Offsets of the unescaped `|` characters that divide the row. */
  pipes: number[]
  /** The spans between those pipes, padding included. */
  cells: CellRange[]
}

export interface TableModel {
  /** 0-based index of the header line within the document. */
  start: number
  /** 0-based index of the table's last line. */
  end: number
  aligns: TableAlign[]
  /** The header first, then the body. The delimiter row is not a row. */
  rows: string[][]
}

/**
 * Splits a row on its pipes. The cell spans exclude the pipes but keep the
 * spaces around the text: the editor hides only the pipes, and those spaces
 * become the cell's inner padding.
 */
export function rowLayout(text: string): RowLayout {
  const pipes: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\') i += 1
    else if (text[i] === '|') pipes.push(i)
  }
  if (pipes.length === 0) return { pipes, cells: [] }

  const start = text.length - text.trimStart().length
  const end = text.trimEnd().length
  const cells: CellRange[] = []
  let from = pipes[0] === start ? start + 1 : start
  for (const pipe of pipes) {
    if (pipe < from) continue
    cells.push({ from, to: pipe })
    from = pipe + 1
  }
  // Leading and trailing pipes are both optional in GFM. Only add a final cell
  // when the row really ends with text, or `| a |` would gain an empty third.
  if (from <= end && pipes[pipes.length - 1] !== end - 1) cells.push({ from, to: end })
  return { pipes, cells }
}

export function rowCells(text: string): CellRange[] {
  return rowLayout(text).cells
}

/** A row's cell contents, trimmed of the padding the source carries. */
export function rowValues(text: string): string[] {
  return rowCells(text).map((cell) => text.slice(cell.from, cell.to).trim())
}

const DELIMITER_CELL = /^:?-+:?$/

/** The `| --- | :--: |` line that turns the two rows around it into a table. */
export function isDelimiterRow(text: string): boolean {
  const values = rowValues(text)
  return values.length > 0 && values.every((value) => DELIMITER_CELL.test(value))
}

function alignOf(value: string): TableAlign {
  const left = value.startsWith(':')
  const right = value.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  if (left) return 'left'
  return 'none'
}

const ALIGN_CELL: Record<TableAlign, string> = {
  none: '---',
  left: ':---',
  center: ':---:',
  right: '---:',
}

/** Per-column alignment read off a delimiter row. */
export function rowAligns(text: string): TableAlign[] {
  return rowValues(text).map(alignOf)
}

/**
 * A row in canonical form. An empty cell comes out as `|  |` rather than `| |`,
 * which leaves the cursor a spot to sit in that is inside the cell on both
 * sides — typing there produces `| x |` with no cleanup needed.
 */
export function formatRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`
}

export function formatTable(table: TableModel): string {
  return [
    formatRow(table.rows[0]),
    formatRow(table.aligns.map((align) => ALIGN_CELL[align])),
    ...table.rows.slice(1).map(formatRow),
  ].join('\n')
}

/** A blank table: `rows` counts the header, so 2×2 is a header and one row. */
export function createTable(columns: number, rows: number): string {
  return formatTable({
    start: 0,
    end: rows,
    aligns: new Array<TableAlign>(columns).fill('none'),
    rows: Array.from({ length: rows }, () => new Array<string>(columns).fill('')),
  })
}

/** A line that could be part of a table: it has content and at least one pipe. */
function isRowLine(text: string): boolean {
  return text.trim().length > 0 && rowLayout(text).pipes.length > 0
}

function sized<T>(values: T[], columns: number, blank: T): T[] {
  const next = values.slice(0, columns)
  while (next.length < columns) next.push(blank)
  return next
}

/**
 * The table containing `index`, or null. Rows are squared off against the
 * header's column count on the way out, so callers never have to think about
 * the ragged tables GFM permits.
 */
export function tableAt(lines: string[], index: number): TableModel | null {
  if (index < 0 || index >= lines.length || !isRowLine(lines[index])) return null

  // Every table has exactly one delimiter row, immediately under its header, so
  // finding that row is what fixes the block's bounds.
  let delimiter = -1
  if (index + 1 < lines.length && isDelimiterRow(lines[index + 1])) {
    delimiter = index + 1
  } else {
    for (let n = index; n > 0 && isRowLine(lines[n]); n -= 1) {
      if (isDelimiterRow(lines[n])) {
        delimiter = n
        break
      }
    }
  }
  if (delimiter < 1) return null

  const start = delimiter - 1
  if (!isRowLine(lines[start]) || isDelimiterRow(lines[start])) return null

  let end = delimiter
  while (end + 1 < lines.length && isRowLine(lines[end + 1]) && !isDelimiterRow(lines[end + 1])) {
    end += 1
  }
  if (index < start || index > end) return null

  const header = rowValues(lines[start])
  const columns = header.length
  const rows = [header]
  for (let n = delimiter + 1; n <= end; n += 1) rows.push(sized(rowValues(lines[n]), columns, ''))
  return {
    start,
    end,
    aligns: sized(rowAligns(lines[delimiter]), columns, 'none'),
    rows,
  }
}

/** Which cell of `text` holds `offset`, or -1 when it falls on a pipe. */
export function cellIndexAt(text: string, offset: number): number {
  return rowCells(text).findIndex((cell) => offset >= cell.from && offset <= cell.to)
}

/**
 * A blank row at `at`. The header keeps its place — inserting "above" the first
 * row means directly under the header, since a table without one is not a table.
 */
export function withRow(table: TableModel, at: number): TableModel {
  const index = Math.min(Math.max(at, 1), table.rows.length)
  const rows = table.rows.slice()
  rows.splice(index, 0, new Array<string>(table.aligns.length).fill(''))
  return { ...table, rows }
}

/** Null when the table would be left with nothing — the caller removes it. */
export function withoutRow(table: TableModel, at: number): TableModel | null {
  if (table.rows.length <= 1) return null
  const rows = table.rows.slice()
  rows.splice(at, 1)
  return { ...table, rows }
}

export function withColumn(table: TableModel, at: number): TableModel {
  const index = Math.min(Math.max(at, 0), table.aligns.length)
  const aligns = table.aligns.slice()
  aligns.splice(index, 0, 'none')
  return {
    ...table,
    aligns,
    rows: table.rows.map((row) => {
      const next = row.slice()
      next.splice(index, 0, '')
      return next
    }),
  }
}

export function withoutColumn(table: TableModel, at: number): TableModel | null {
  if (table.aligns.length <= 1) return null
  const aligns = table.aligns.slice()
  aligns.splice(at, 1)
  return {
    ...table,
    aligns,
    rows: table.rows.map((row) => {
      const next = row.slice()
      next.splice(at, 1)
      return next
    }),
  }
}
