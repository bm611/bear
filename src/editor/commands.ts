import type { ChangeSpec, EditorState } from '@codemirror/state'
import { EditorSelection } from '@codemirror/state'
import type { Command, EditorView } from '@codemirror/view'
import { createTable } from '../lib/table'

/** Wraps or unwraps each selection range with a markdown delimiter. */
export function toggleWrap(marker: string, endMarker = marker): Command {
  return (view) => {
    const { state } = view
    const changes: ChangeSpec[] = []
    const ranges: Array<{ anchor: number; head: number }> = []
    let offset = 0

    for (const range of state.selection.ranges) {
      const before = state.sliceDoc(Math.max(0, range.from - marker.length), range.from)
      const after = state.sliceDoc(range.to, Math.min(state.doc.length, range.to + endMarker.length))
      const wrapped = before === marker && after === endMarker

      if (wrapped) {
        changes.push(
          { from: range.from - marker.length, to: range.from, insert: '' },
          { from: range.to, to: range.to + endMarker.length, insert: '' },
        )
        ranges.push({
          anchor: range.from + offset - marker.length,
          head: range.to + offset - marker.length,
        })
        offset -= marker.length + endMarker.length
        continue
      }

      changes.push(
        { from: range.from, insert: marker },
        { from: range.to, insert: endMarker },
      )
      ranges.push({
        anchor: range.from + offset + marker.length,
        head: range.to + offset + marker.length,
      })
      offset += marker.length + endMarker.length
    }

    view.dispatch({
      changes,
      selection: EditorSelection.create(
        ranges.map((r) => EditorSelection.range(r.anchor, r.head)),
        state.selection.mainIndex,
      ),
      scrollIntoView: true,
      userEvent: 'input.format',
    })
    return true
  }
}

function selectedLines(state: EditorState) {
  const lines: Array<{ from: number; to: number; text: string; number: number }> = []
  const seen = new Set<number>()
  for (const range of state.selection.ranges) {
    let pos = range.from
    while (pos <= range.to) {
      const line = state.doc.lineAt(pos)
      if (!seen.has(line.number)) {
        seen.add(line.number)
        lines.push({ from: line.from, to: line.to, text: line.text, number: line.number })
      }
      if (line.to >= state.doc.length) break
      pos = line.to + 1
    }
  }
  return lines
}

/** Rewrites every selected line through `map`, keeping the cursor sensible. */
function mapLines(view: EditorView, map: (text: string, allPrefixed: boolean) => string, test?: RegExp): boolean {
  const { state } = view
  const lines = selectedLines(state)
  if (lines.length === 0) return false
  const allPrefixed = test ? lines.every((line) => test.test(line.text)) : false
  const changes = lines
    .map((line) => {
      const next = map(line.text, allPrefixed)
      if (next === line.text) return null

      // Keep the edit as small as possible. Replacing the whole line makes
      // CodeMirror collapse a cursor inside it to one edge of the replacement.
      let prefix = 0
      while (prefix < line.text.length && prefix < next.length && line.text[prefix] === next[prefix]) {
        prefix += 1
      }
      let suffix = 0
      while (
        suffix < line.text.length - prefix &&
        suffix < next.length - prefix &&
        line.text[line.text.length - suffix - 1] === next[next.length - suffix - 1]
      ) {
        suffix += 1
      }
      return {
        from: line.from + prefix,
        to: line.to - suffix,
        insert: next.slice(prefix, next.length - suffix),
      }
    })
    .filter((change): change is NonNullable<typeof change> => change !== null)
  if (changes.length === 0) return false
  const changeSet = state.changes(changes)
  view.dispatch({
    changes: changeSet,
    selection: EditorSelection.create(
      state.selection.ranges.map((range) =>
        EditorSelection.range(
          changeSet.mapPos(range.anchor, 1),
          changeSet.mapPos(range.head, 1),
        ),
      ),
      state.selection.mainIndex,
    ),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
  return true
}

const TODO_PREFIX = /^(\s*)(?:[-*+][ \t]+)?\[[ xX]\][ \t]?/
const BULLET_PREFIX = /^(\s*)[-*+][ \t]+/
const NUMBER_PREFIX = /^(\s*)\d+[.)][ \t]+/
const QUOTE_PREFIX = /^(\s*)>[ \t]?/
const HEADING_PREFIX = /^(\s{0,3})(#{1,6})[ \t]+/

/** ⌘⇧U — turn the selected lines into todos, or back into plain lines. */
export const toggleTodo: Command = (view) =>
  mapLines(
    view,
    (text, allTodos) => {
      if (allTodos) return text.replace(TODO_PREFIX, '$1')
      const stripped = text.replace(BULLET_PREFIX, '$1').replace(NUMBER_PREFIX, '$1')
      const indent = /^\s*/.exec(stripped)?.[0] ?? ''
      return `${indent}- [ ] ${stripped.slice(indent.length)}`
    },
    TODO_PREFIX,
  )

export const toggleBulletList: Command = (view) =>
  mapLines(
    view,
    (text, allBullets) => {
      if (allBullets) return text.replace(BULLET_PREFIX, '$1')
      const stripped = text.replace(TODO_PREFIX, '$1').replace(NUMBER_PREFIX, '$1')
      const indent = /^\s*/.exec(stripped)?.[0] ?? ''
      return `${indent}- ${stripped.slice(indent.length)}`
    },
    BULLET_PREFIX,
  )

export const toggleNumberedList: Command = (view) => {
  let counter = 0
  return mapLines(
    view,
    (text, allNumbered) => {
      if (allNumbered) return text.replace(NUMBER_PREFIX, '$1')
      const stripped = text.replace(TODO_PREFIX, '$1').replace(BULLET_PREFIX, '$1')
      const indent = /^\s*/.exec(stripped)?.[0] ?? ''
      counter += 1
      return `${indent}${counter}. ${stripped.slice(indent.length)}`
    },
    NUMBER_PREFIX,
  )
}

export const toggleQuote: Command = (view) =>
  mapLines(
    view,
    (text, allQuoted) => {
      if (allQuoted) return text.replace(QUOTE_PREFIX, '$1')
      const indent = /^\s*/.exec(text)?.[0] ?? ''
      return `${indent}> ${text.slice(indent.length)}`
    },
    QUOTE_PREFIX,
  )

/** Applies a heading level to the selected lines; the same level again clears it. */
export function setHeading(level: number): Command {
  const hashes = '#'.repeat(level)
  const same = new RegExp(`^(\\s{0,3})${hashes}[ \\t]+`)
  return (view) =>
    mapLines(
      view,
      (text, allSame) => {
        const body = text.replace(HEADING_PREFIX, '$1')
        if (allSame) return body
        const indent = /^\s{0,3}/.exec(body)?.[0] ?? ''
        return `${indent}${hashes} ${body.slice(indent.length)}`
      },
      same,
    )
}

const URL_RE = /^(?:[a-z][a-z0-9+.-]*:|www\.)[^\s]+$/i

/** ⌘K — wrap the selection in a link, leaving the cursor in the URL slot. */
export const insertLink: Command = (view) => {
  if (!view.hasFocus) view.focus()
  const range = view.state.selection.main
  const text = view.state.sliceDoc(range.from, range.to)
  const isUrl = URL_RE.test(text.trim())
  const url = isUrl ? text.trim() : 'url'
  const insert = isUrl ? `[](${url})` : `[${text}](url)`
  const urlFrom = isUrl ? range.from + 3 : range.from + text.length + 3

  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: isUrl
      ? EditorSelection.cursor(range.from + 1)
      : EditorSelection.range(urlFrom, urlFrom + 3),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
  if (!view.hasFocus) view.focus()
  return true
}

export const insertHorizontalRule: Command = (view) => {
  const line = view.state.doc.lineAt(view.state.selection.main.head)
  const prefix = line.text.trim() ? '\n' : ''
  const insert = `${prefix}---\n`
  view.dispatch({
    changes: { from: line.to, insert },
    selection: EditorSelection.cursor(line.to + insert.length),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
  return true
}

export const insertCodeBlock: Command = (view) => {
  const { state } = view
  const range = state.selection.main
  const firstLine = state.doc.lineAt(range.from)
  const lastLine = state.doc.lineAt(range.to)

  // A selection becomes the body of the fence. With only a cursor, insert the
  // block on the current empty line or immediately after a line with content.
  const from = range.empty && firstLine.text ? firstLine.to : firstLine.from
  const to = range.empty ? from : lastLine.to
  const body = range.empty ? '' : state.sliceDoc(from, to)
  const leadingBreak = range.empty && firstLine.text ? '\n' : ''
  const trailingBreak = to < state.doc.length ? '\n' : ''
  const insert = `${leadingBreak}\`\`\`\n${body}\n\`\`\`${trailingBreak}`
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.cursor(from + leadingBreak.length + 4),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
  return true
}

/**
 * A blank 2×2 table: a header row and one row under it. GFM only reads a table
 * as one when it starts its own block, so a filled line gets a blank line
 * between it and the table.
 */
export const insertTable: Command = (view) => {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.head)
  const filled = line.text.trim().length > 0
  const from = filled ? line.to : line.from
  const lead = filled ? '\n\n' : ''
  const insert = `${lead}${createTable(2, 2)}\n`

  view.dispatch({
    changes: { from, insert },
    // Into the first header cell, past the `| ` that opens it.
    selection: EditorSelection.cursor(from + lead.length + 2),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
  return true
}

export const toggleBold = toggleWrap('**')
export const toggleItalic = toggleWrap('*')
export const toggleStrikethrough = toggleWrap('~~')
export const toggleHighlight = toggleWrap('==')
export const toggleInlineCode = toggleWrap('`')

/** Which formatting the caret currently sits in, for the toolbar to reflect. */
export interface ActiveFormats {
  /** Heading level shared by every selected line, or null when there is none. */
  heading: number | null
  bold: boolean
  italic: boolean
  todo: boolean
  bullet: boolean
  quote: boolean
}

export const NO_FORMATS: ActiveFormats = {
  heading: null,
  bold: false,
  italic: false,
  todo: false,
  bullet: false,
  quote: false,
}

/** True when every range already sits between the given delimiters. */
function isWrapped(state: EditorState, marker: string, endMarker = marker): boolean {
  return state.selection.ranges.every((range) => {
    const before = state.sliceDoc(Math.max(0, range.from - marker.length), range.from)
    const after = state.sliceDoc(range.to, Math.min(state.doc.length, range.to + endMarker.length))
    return before === marker && after === endMarker
  })
}

/**
 * What the toolbar should light up for the current selection. Each test
 * mirrors the matching command's own "already applied, so strip it" branch, so
 * a lit button is a promise that pressing it takes the formatting back off.
 */
export function activeFormats(state: EditorState): ActiveFormats {
  const lines = selectedLines(state)
  const everyLine = (test: RegExp) =>
    lines.length > 0 && lines.every((line) => test.test(line.text))

  const levels = lines.map((line) => HEADING_PREFIX.exec(line.text)?.[2].length ?? 0)
  const heading =
    levels.length > 0 && levels[0] > 0 && levels.every((level) => level === levels[0])
      ? levels[0]
      : null

  const bold = isWrapped(state, '**')
  const todo = everyLine(TODO_PREFIX)
  return {
    heading,
    bold,
    // The star either side of `**text**` belongs to the bold pair, not italics.
    italic: !bold && isWrapped(state, '*'),
    todo,
    // A todo line opens with `- `, so it satisfies BULLET_PREFIX too. Only the
    // more specific of the two claims the highlight.
    bullet: !todo && everyLine(BULLET_PREFIX),
    quote: everyLine(QUOTE_PREFIX),
  }
}
