import { syntaxTree } from '@codemirror/language'
import {
  EditorSelection,
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from '@codemirror/state'
import {
  type Command,
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view'
import {
  cellIndexAt,
  formatRow,
  formatTable,
  isDelimiterRow,
  rowAligns,
  rowCells,
  rowLayout,
  tableAt,
  withColumn,
  withRow,
  withoutColumn,
  withoutRow,
  type CellRange,
  type TableAlign,
  type TableModel,
} from '../lib/table'

/* ------------------------------------------------------------ decoration */

/**
 * Tables are drawn as a grid rather than left as source: the pipes are hidden,
 * each cell becomes a flex column so every row lines up with the one above it,
 * and the delimiter row disappears into the rule under the header.
 *
 * These are block decorations, which a view plugin is not allowed to produce,
 * so they live in a state field. Nothing here depends on the viewport or the
 * selection anyway — unlike the marks in `decorations.ts`, a table's grid does
 * not unfold when the cursor enters it.
 */
interface TableSets {
  all: DecorationSet
  atomic: DecorationSet
}

const hiddenPipe = Decoration.replace({})
const hiddenRow = Decoration.replace({ block: true })

const tableLines = new Map<string, Decoration>()

function tableLine(header: boolean, last: boolean, shaded: boolean): Decoration {
  const cls = `cm-table-line${header ? ' cm-table-head' : ''}${last ? ' cm-table-last' : ''}${
    shaded ? ' cm-table-alt' : ''
  }`
  let deco = tableLines.get(cls)
  if (!deco) {
    deco = Decoration.line({ class: cls })
    tableLines.set(cls, deco)
  }
  return deco
}

const tableCells = new Map<string, Decoration>()

function tableCell(header: boolean, last: boolean, align: TableAlign): Decoration {
  const cls = `cm-table-cell${header ? ' cm-table-head-cell' : ''}${
    last ? ' cm-table-cell-end' : ''
  }${align === 'none' ? '' : ` cm-table-${align}`}`
  let deco = tableCells.get(cls)
  if (!deco) {
    deco = Decoration.mark({ class: cls })
    tableCells.set(cls, deco)
  }
  return deco
}

function decorateTable(
  state: EditorState,
  from: number,
  to: number,
  marks: Range<Decoration>[],
  structure: Range<Decoration>[],
) {
  const doc = state.doc
  const first = doc.lineAt(from)
  const last = doc.lineAt(Math.max(from, to - 1))
  const delimiter = first.number + 1
  if (delimiter > last.number) return
  const delimiterLine = doc.line(delimiter)
  if (!isDelimiterRow(delimiterLine.text)) return

  const aligns = rowAligns(delimiterLine.text)
  // A table with no body is just its header once the delimiter row is hidden.
  const bottom = last.number === delimiter ? first.number : last.number

  for (let n = first.number; n <= last.number; n += 1) {
    if (n === delimiter) {
      // The line break above goes with it — replacing the row alone would leave
      // an empty line where it used to be.
      structure.push(hiddenRow.range(delimiterLine.from - 1, delimiterLine.to))
      continue
    }
    const line = doc.line(n)
    const { pipes, cells } = rowLayout(line.text)
    if (cells.length === 0) continue

    const header = n === first.number
    // Body rows alternate their tint under the header's, so the eye can follow
    // one across without a rule under every row.
    const shaded = !header && (n - delimiter - 1) % 2 === 1
    marks.push(tableLine(header, n === bottom, shaded).range(line.from))
    for (const pipe of pipes) {
      structure.push(hiddenPipe.range(line.from + pipe, line.from + pipe + 1))
    }
    cells.forEach((cell, index) => {
      // A cell needs a character to hang its column on. `||` has none, so that
      // row falls back to unstyled text until something is typed into it.
      if (cell.to <= cell.from) return
      marks.push(
        tableCell(header, index === cells.length - 1, aligns[index] ?? 'none').range(
          line.from + cell.from,
          line.from + cell.to,
        ),
      )
    })
  }
}

function buildTables(state: EditorState): TableSets {
  const marks: Range<Decoration>[] = []
  const structure: Range<Decoration>[] = []

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name !== 'Table') return undefined
      decorateTable(state, node.from, node.to, marks, structure)
      // The cells are laid out from the line text above; the inline markup
      // inside them is `decorations.ts`'s business, not this field's.
      return false
    },
  })

  return {
    all: Decoration.set([...marks, ...structure], true),
    // Only the pipes and the delimiter row: the cursor has to move freely
    // through the cells, but it should never land inside hidden punctuation.
    atomic: Decoration.set(structure, true),
  }
}

const tableField = StateField.define<TableSets>({
  create: buildTables,
  update(sets, tr) {
    if (!tr.docChanged && syntaxTree(tr.startState) === syntaxTree(tr.state)) return sets
    return buildTables(tr.state)
  },
  provide: (field) => [
    EditorView.decorations.from(field, (sets) => sets.all),
    EditorView.atomicRanges.of((view) => view.state.field(field).atomic),
  ],
})

/* ---------------------------------------------------------------- editing */

export type TableAction =
  | 'row-above'
  | 'row-below'
  | 'column-left'
  | 'column-right'
  | 'delete-row'
  | 'delete-column'
  | 'delete-table'

/** Where the edit lands: the table, and the cell it was asked from. */
interface Target {
  table: TableModel
  /** Index into `table.rows`, where 0 is the header. */
  row: number
  column: number
}

function targetAt(state: EditorState, pos: number): Target | null {
  const line = state.doc.lineAt(pos)
  const table = tableAt(state.doc.toString().split('\n'), line.number - 1)
  if (!table) return null
  // The delimiter row occupies a line but is not a row of the model.
  const offset = line.number - 1 - table.start
  return {
    table,
    row: offset === 0 ? 0 : offset - 1,
    column: Math.max(cellIndexAt(line.text, pos - line.from), 0),
  }
}

/** The table after `action`, and the cell the cursor should end up in. */
function applied(target: Target, action: TableAction): { table: TableModel | null; row: number; column: number } {
  const { table, row, column } = target
  switch (action) {
    case 'row-above': {
      const at = Math.max(row, 1)
      return { table: withRow(table, at), row: at, column }
    }
    case 'row-below': {
      const at = Math.max(row + 1, 1)
      return { table: withRow(table, at), row: at, column }
    }
    case 'column-left':
      return { table: withColumn(table, column), row, column }
    case 'column-right':
      return { table: withColumn(table, column + 1), row, column: column + 1 }
    case 'delete-row': {
      const next = withoutRow(table, row)
      return { table: next, row: next ? Math.min(row, next.rows.length - 1) : 0, column }
    }
    case 'delete-column': {
      const next = withoutColumn(table, column)
      return { table: next, row, column: next ? Math.min(column, next.aligns.length - 1) : 0 }
    }
    case 'delete-table':
      return { table: null, row: 0, column: 0 }
  }
}

/** Offset of a cell's text within a rendered table, for placing the cursor. */
function cellOffset(text: string, row: number, column: number): number {
  const lines = text.split('\n')
  // Back past the delimiter row, which sits between the header and the body.
  const index = Math.min(row === 0 ? 0 : row + 1, lines.length - 1)
  let offset = 0
  for (let n = 0; n < index; n += 1) offset += lines[n].length + 1
  const cell = rowCells(lines[index])[column]
  // One character in, so the cursor sits after the cell's leading space rather
  // than against the pipe that was just hidden.
  return offset + (cell ? cell.from + 1 : 0)
}

/** Runs a row/column edit on the table holding `pos`. */
export function applyTableAction(view: EditorView, pos: number, action: TableAction): boolean {
  if (view.state.readOnly) return false
  const target = targetAt(view.state, pos)
  if (!target) return false

  const doc = view.state.doc
  const result = applied(target, action)
  let from = doc.line(target.table.start + 1).from
  let to = doc.line(target.table.end + 1).to

  if (!result.table) {
    // Take a line break with it, so removing a table does not leave a blank
    // line behind where it stood.
    if (to < doc.length) to += 1
    else if (from > 0) from -= 1
    view.dispatch({
      changes: { from, to, insert: '' },
      selection: EditorSelection.cursor(from),
      scrollIntoView: true,
      userEvent: 'input.table',
    })
    return true
  }

  const insert = formatTable(result.table)
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.cursor(from + cellOffset(insert, result.row, result.column)),
    scrollIntoView: true,
    userEvent: 'input.table',
  })
  return true
}

/* ------------------------------------------------------------ navigation */

/**
 * Where the cursor belongs inside a cell: at the end of its text, or between
 * the two spaces of an empty one. Never against a pipe, which is hidden and
 * atomic — the cursor would appear to be in the neighbouring cell.
 */
function caretIn(text: string, cell: CellRange): number {
  const inner = text.slice(cell.from, cell.to).trimEnd().length
  return cell.from + Math.max(inner, 1)
}

/** The table line before or after `n`, stepping over the delimiter row. */
function siblingLine(table: TableModel, n: number, forward: boolean): number | null {
  const header = table.start + 1
  const body = header + 2
  if (forward) {
    const next = n === header ? body : n + 1
    return next <= table.end + 1 ? next : null
  }
  const previous = n === body ? header : n - 1
  return previous >= header ? previous : null
}

/**
 * ⇥ and ⇧⇥ step between cells rather than indenting, which inside a row would
 * only push the pipes out of line. Tab past the last cell adds a row, the way
 * every other table editor does.
 */
function moveCell(forward: boolean): Command {
  return (view) => {
    const { state } = view
    const line = state.doc.lineAt(state.selection.main.head)
    const table = tableAt(state.doc.toString().split('\n'), line.number - 1)
    if (!table) return false

    const cells = rowCells(line.text)
    const column = Math.max(cellIndexAt(line.text, state.selection.main.head - line.from), 0)
    const next = cells[column + (forward ? 1 : -1)]
    if (next) {
      view.dispatch({
        selection: EditorSelection.cursor(line.from + caretIn(line.text, next)),
        scrollIntoView: true,
      })
      return true
    }

    const sibling = siblingLine(table, line.number, forward)
    if (sibling === null) {
      // Off the end of the table: a new row, ready to type into. Off the top,
      // there is nowhere to go, but Tab must not fall through and indent.
      if (!forward || state.readOnly) return true
      const insert = `\n${formatRow(new Array<string>(table.aligns.length).fill(''))}`
      view.dispatch({
        changes: { from: line.to, insert },
        selection: EditorSelection.cursor(line.to + 3),
        scrollIntoView: true,
        userEvent: 'input.table',
      })
      return true
    }

    const target = state.doc.line(sibling)
    const wrapped = rowCells(target.text)
    const cell = forward ? wrapped[0] : wrapped[wrapped.length - 1]
    if (!cell) return true
    view.dispatch({
      selection: EditorSelection.cursor(target.from + caretIn(target.text, cell)),
      scrollIntoView: true,
    })
    return true
  }
}

export const nextTableCell = moveCell(true)
export const previousTableCell = moveCell(false)

/* ------------------------------------------------------------- cell menu */

const ITEMS: Array<{ action: TableAction; label: string; separated?: boolean }> = [
  { action: 'row-above', label: 'Insert row above' },
  { action: 'row-below', label: 'Insert row below' },
  { action: 'column-left', label: 'Insert column left' },
  { action: 'column-right', label: 'Insert column right' },
  { action: 'delete-row', label: 'Delete row', separated: true },
  { action: 'delete-column', label: 'Delete column' },
  { action: 'delete-table', label: 'Delete table' },
]

function dots(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'currentColor')
  for (const cy of [3.6, 8, 12.4]) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('cx', '8')
    dot.setAttribute('cy', String(cy))
    dot.setAttribute('r', '1.35')
    svg.append(dot)
  }
  return svg
}

/**
 * The ⋮ button that appears over a hovered cell. It lives in the scroller
 * rather than the content, so it scrolls with the table without ever becoming
 * part of the editable document.
 */
class CellMenu {
  private anchor = document.createElement('div')
  private button = document.createElement('button')
  private menu: HTMLDivElement | null = null
  private pos = 0

  constructor(private view: EditorView) {
    this.anchor.className = 'cm-table-anchor'
    this.button.type = 'button'
    this.button.className = 'cm-table-handle'
    this.button.title = 'Table options'
    this.button.setAttribute('aria-label', 'Table options')
    this.button.setAttribute('aria-haspopup', 'menu')
    this.button.append(dots())
    // Keep the click from moving the text cursor out of the cell.
    this.button.addEventListener('mousedown', (event) => event.preventDefault())
    this.button.addEventListener('click', () => (this.menu ? this.closeMenu() : this.openMenu()))
    this.anchor.append(this.button)
    view.scrollDOM.append(this.anchor)

    view.scrollDOM.addEventListener('mouseover', this.onOver)
    view.scrollDOM.addEventListener('mouseleave', this.onLeave)
    document.addEventListener('pointerdown', this.onOutside, true)
    document.addEventListener('keydown', this.onKeyDown, true)
  }

  private onOver = (event: MouseEvent) => {
    if (this.menu) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.('.cm-table-cell') as HTMLElement | null
    if (cell) this.show(cell)
    else if (!target || !this.anchor.contains(target)) this.hide()
  }

  private onLeave = () => {
    if (!this.menu) this.hide()
  }

  private onOutside = (event: PointerEvent) => {
    if (!this.menu) return
    if (!this.anchor.contains(event.target as Node)) this.closeMenu()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.menu || event.key !== 'Escape') return
    event.stopPropagation()
    this.closeMenu()
    this.view.focus()
  }

  private show(cell: HTMLElement) {
    if (this.view.state.readOnly) return
    const scroller = this.view.scrollDOM
    const base = scroller.getBoundingClientRect()
    const rect = cell.getBoundingClientRect()
    this.pos = this.view.posAtDOM(cell)
    this.anchor.style.left = `${rect.right - base.left + scroller.scrollLeft}px`
    this.anchor.style.top = `${rect.top + rect.height / 2 - base.top + scroller.scrollTop}px`
    this.anchor.dataset.visible = 'true'
  }

  private hide() {
    delete this.anchor.dataset.visible
  }

  private openMenu() {
    const menu = document.createElement('div')
    menu.className = 'menu'
    menu.dataset.align = 'right'
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', 'Table options')

    for (const item of ITEMS) {
      if (item.separated) {
        const rule = document.createElement('div')
        rule.className = 'menu-separator'
        rule.setAttribute('role', 'separator')
        menu.append(rule)
      }
      const entry = document.createElement('button')
      entry.type = 'button'
      entry.className = 'menu-item'
      entry.setAttribute('role', 'menuitem')
      if (item.action.startsWith('delete')) entry.dataset.danger = 'true'
      entry.textContent = item.label
      entry.addEventListener('mousedown', (event) => event.preventDefault())
      entry.addEventListener('click', () => {
        const pos = this.pos
        this.closeMenu()
        this.hide()
        applyTableAction(this.view, pos, item.action)
        this.view.focus()
      })
      menu.append(entry)
    }

    this.anchor.append(menu)
    this.menu = menu
    menu.querySelector<HTMLButtonElement>('.menu-item')?.focus()
  }

  private closeMenu() {
    this.menu?.remove()
    this.menu = null
  }

  update(update: ViewUpdate) {
    // Any edit moves the cells out from under the handle; the next hover puts
    // it back in the right place.
    if (update.docChanged) {
      this.closeMenu()
      this.hide()
    }
  }

  destroy() {
    this.view.scrollDOM.removeEventListener('mouseover', this.onOver)
    this.view.scrollDOM.removeEventListener('mouseleave', this.onLeave)
    document.removeEventListener('pointerdown', this.onOutside, true)
    document.removeEventListener('keydown', this.onKeyDown, true)
    this.anchor.remove()
  }
}

export function slateTables(): Extension[] {
  return [tableField, ViewPlugin.define((view) => new CellMenu(view))]
}
