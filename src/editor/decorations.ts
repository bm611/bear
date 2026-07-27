import { syntaxTree } from '@codemirror/language'
import type { Range } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { matchTagRanges } from '../lib/tags'

const CODE_NODES = /^(InlineCode|CodeText|FencedCode|CodeBlock|Comment|CommentBlock|URL|LinkTitle)$/

/** True when `pos` sits inside code, where hashtags are just characters. */
function inCode(view: EditorView, pos: number): boolean {
  let node = syntaxTree(view.state).resolveInner(pos, 1)
  while (node.parent) {
    if (CODE_NODES.test(node.name)) return true
    node = node.parent
  }
  return CODE_NODES.test(node.name)
}

const TODO_RE = /^(\s*)(?:[-*+][ \t]+)?\[([ xX])\](?=[ \t]|$)/

class TodoWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly bracketFrom: number,
  ) {
    super()
  }

  eq(other: TodoWidget): boolean {
    return other.checked === this.checked && other.bracketFrom === this.bracketFrom
  }

  toDOM(view: EditorView): HTMLElement {
    const box = document.createElement('span')
    box.className = this.checked ? 'cm-todo cm-todo-checked' : 'cm-todo'
    box.setAttribute('role', 'checkbox')
    box.setAttribute('aria-checked', String(this.checked))
    box.title = this.checked ? 'Mark as not done' : 'Mark as done'
    box.addEventListener('mousedown', (event) => {
      event.preventDefault()
      view.dispatch({
        changes: {
          from: this.bracketFrom,
          to: this.bracketFrom + 3,
          insert: this.checked ? '[ ]' : '[x]',
        },
      })
    })
    return box
  }

  ignoreEvent(): boolean {
    return false
  }
}

interface DecorationSets {
  all: DecorationSet
  atomic: DecorationSet
}

function lineClass(level: string) {
  return Decoration.line({ class: `cm-heading-${level}` })
}

const quoteLine = Decoration.line({ class: 'cm-quote-line' })
const codeLine = Decoration.line({ class: 'cm-code-line' })
const hiddenMark = Decoration.replace({})
const hashtagMark = Decoration.mark({ class: 'cm-hashtag' })
const todoDoneMark = Decoration.mark({ class: 'cm-todo-done' })
const highlightMark = Decoration.mark({ class: 'cm-highlight' })

/** Bear's `==highlight==`, which is not part of CommonMark or GFM. */
const HIGHLIGHT_RE = /==(?=[^\s=])((?:[^=\n]|=(?!=))*[^\s=])==/g

/** `#{1,6} `, the heading text, then an optional closing run of `#`. */
const ATX_MARK_RE = /^([ \t]*#{1,6}[ \t]+)([\s\S]*?)((?:[ \t]+#+)?[ \t]*)$/

/**
 * The parts of an ATX heading line to fold away — the leading hashes with their
 * space, and any closing `##` — as offsets into the line. Size and weight
 * already say "heading", so leaving the hashes in makes the line read as
 * unrendered markup. Nothing is hidden when the line is only markers: that
 * would leave a blank line with no hint of what it is.
 */
export function headingMarkRanges(text: string): Array<{ from: number; to: number }> {
  const match = ATX_MARK_RE.exec(text)
  if (!match || match[2].trim() === '') return []
  const ranges = [{ from: 0, to: match[1].length }]
  if (match[3].length > 0) {
    ranges.push({ from: match[1].length + match[2].length, to: text.length })
  }
  return ranges
}

/**
 * Line numbers holding a cursor or selection, where the markup stays visible so
 * it can be edited. An unfocused editor has no cursor to speak of — a note just
 * opened sits at offset 0, and revealing its title's `#` would be noise.
 */
function activeLines(view: EditorView): Set<number> {
  const lines = new Set<number>()
  if (!view.hasFocus) return lines
  const doc = view.state.doc
  for (const range of view.state.selection.ranges) {
    const first = doc.lineAt(range.from).number
    const last = doc.lineAt(range.to).number
    for (let n = first; n <= last; n += 1) lines.add(n)
  }
  return lines
}

function build(view: EditorView): DecorationSets {
  const decorations: Range<Decoration>[] = []
  const hidden: Range<Decoration>[] = []
  const replacements: Range<Decoration>[] = []
  const doc = view.state.doc
  const tree = syntaxTree(view.state)
  const active = activeLines(view)

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(node.name)
        if (heading) {
          const line = doc.lineAt(node.from)
          decorations.push(lineClass(heading[1]).range(line.from))
          // Setext headings underline the text on a second line; hiding that
          // would leave an empty line behind, so only ATX `#` folds away.
          if (node.name.startsWith('ATX') && !active.has(line.number)) {
            for (const range of headingMarkRanges(line.text)) {
              hidden.push(hiddenMark.range(line.from + range.from, line.from + range.to))
            }
          }
          return
        }
        if (node.name === 'Blockquote' || node.name === 'FencedCode' || node.name === 'CodeBlock') {
          const decoration = node.name === 'Blockquote' ? quoteLine : codeLine
          const first = doc.lineAt(node.from).number
          const last = doc.lineAt(Math.min(node.to, doc.length)).number
          for (let n = first; n <= last; n += 1) {
            decorations.push(decoration.range(doc.line(n).from))
          }
        }
      },
    })

    let pos = from
    while (pos <= to) {
      const line = doc.lineAt(pos)
      if (line.length > 0 && !inCode(view, line.from)) {
        const todo = TODO_RE.exec(line.text)
        if (todo) {
          const bracketFrom = line.from + todo[0].indexOf('[')
          const replaceFrom = line.from + todo[1].length
          const replaceTo = bracketFrom + 3
          replacements.push(
            Decoration.replace({
              widget: new TodoWidget(todo[2] !== ' ', bracketFrom),
            }).range(replaceFrom, replaceTo),
          )
          if (todo[2] !== ' ' && replaceTo < line.to) {
            decorations.push(todoDoneMark.range(replaceTo, line.to))
          }
        }

        for (const match of matchTagRanges(line.text)) {
          const start = line.from + match.from
          if (inCode(view, start)) continue
          decorations.push(hashtagMark.range(start, line.from + match.to))
        }

        for (const match of line.text.matchAll(HIGHLIGHT_RE)) {
          const start = line.from + match.index
          if (inCode(view, start)) continue
          decorations.push(highlightMark.range(start, start + match[0].length))
        }
      }
      if (line.to >= doc.length) break
      pos = line.to + 1
    }
  }

  return {
    // Hidden marks stay out of `atomic`: the cursor has to be able to move into
    // them, which is what brings the line's `#` back.
    all: Decoration.set([...decorations, ...hidden, ...replacements], true),
    atomic: Decoration.set(replacements, true),
  }
}

export interface BearDecorationOptions {
  onTagClick: (tag: string) => void
}

export function bearDecorations(options: BearDecorationOptions) {
  const plugin = ViewPlugin.fromClass(
    class {
      sets: DecorationSets

      constructor(view: EditorView) {
        this.sets = build(view)
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          update.focusChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.sets = build(update.view)
        }
      }
    },
    {
      decorations: (value) => value.sets.all,
      provide: (value) => [
        EditorView.atomicRanges.of((view) => view.plugin(value)?.sets.atomic ?? Decoration.none),
      ],
      eventHandlers: {
        mousedown(event) {
          const target = event.target as HTMLElement | null
          const pill = target?.closest?.('.cm-hashtag')
          if (!pill) return false
          const text = pill.textContent?.trim() ?? ''
          const tag = text.replace(/^#/, '').replace(/#$/, '')
          if (!tag) return false
          event.preventDefault()
          options.onTagClick(tag)
          return true
        },
      },
    },
  )
  return plugin
}
