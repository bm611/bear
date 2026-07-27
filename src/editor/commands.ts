import type { ChangeSpec, EditorState } from '@codemirror/state'
import { EditorSelection } from '@codemirror/state'
import type { Command, EditorView } from '@codemirror/view'

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
  const lines = selectedLines(view.state)
  if (lines.length === 0) return false
  const allPrefixed = test ? lines.every((line) => test.test(line.text)) : false
  const changes = lines
    .map((line) => ({ from: line.from, to: line.to, insert: map(line.text, allPrefixed) }))
    .filter((change, index) => change.insert !== lines[index].text)
  if (changes.length === 0) return false
  view.dispatch({ changes, scrollIntoView: true, userEvent: 'input.format' })
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

/** ⌘K — wrap the selection in a link, leaving the cursor in the URL slot. */
export const insertLink: Command = (view) => {
  const range = view.state.selection.main
  const text = view.state.sliceDoc(range.from, range.to)
  const isUrl = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(text)
  const insert = isUrl ? `[](${text})` : `[${text}](url)`
  const cursor = isUrl ? range.from + 1 : range.from + text.length + 3

  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: isUrl
      ? EditorSelection.cursor(cursor)
      : EditorSelection.range(cursor, cursor + 3),
    scrollIntoView: true,
    userEvent: 'input.format',
  })
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
  const range = view.state.selection.main
  const body = view.state.sliceDoc(range.from, range.to)
  const insert = `\`\`\`\n${body}\n\`\`\``
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: EditorSelection.cursor(range.from + 3),
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
