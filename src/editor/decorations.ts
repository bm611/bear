import { syntaxTree } from '@codemirror/language'
import type { SyntaxNode } from '@lezer/common'
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

/** The three interchangeable CommonMark bullets, as opposed to `1.` or `1)`. */
const BULLET_RE = /^[-*+]$/

/**
 * `-`, `*` and `+` all mean the same thing and none of them reads as a list at
 * a glance, so bullet lists draw a round dot instead. It is a styled element
 * rather than a `•`, which keeps the size honest across the three font
 * choices.
 */
class BulletWidget extends WidgetType {
  eq(): boolean {
    // Every bullet is the same dot, so CodeMirror is free to reuse any of them
    // rather than rebuild the DOM as lines shift around.
    return true
  }

  toDOM(): HTMLElement {
    const slot = document.createElement('span')
    slot.className = 'cm-bullet'
    const dot = document.createElement('span')
    dot.className = 'cm-bullet-dot'
    slot.append(dot)
    return slot
  }
}

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
    box.tabIndex = 0
    box.title = this.checked ? 'Mark as not done' : 'Mark as done'
    const toggle = () => {
      view.dispatch({
        changes: {
          from: this.bracketFrom,
          to: this.bracketFrom + 3,
          insert: this.checked ? '[ ]' : '[x]',
        },
      })
    }
    box.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      toggle()
    })
    box.addEventListener('keydown', (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      event.stopPropagation()
      toggle()
    })
    return box
  }

  ignoreEvent(): boolean {
    // The widget owns pointer and keyboard events. Letting CodeMirror process
    // the same mousedown places the text cursor over the replacement range.
    return true
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
const hiddenMark = Decoration.replace({})
const hashtagMark = Decoration.mark({ class: 'cm-hashtag' })
const listMark = Decoration.mark({ class: 'cm-list-marker' })
const bulletMark = Decoration.replace({ widget: new BulletWidget() })
const todoDoneMark = Decoration.mark({ class: 'cm-todo-done' })
const highlightMark = Decoration.mark({ class: 'cm-highlight' })
const SYNTAX_MARK_NODES = /^(EmphasisMark|StrikethroughMark|CodeMark|QuoteMark|LinkMark)$/

/**
 * Where a marker sits: how many lists deep, counting from 0 at the top level,
 * and whether a blockquote is among its ancestors. The source indent that
 * expresses nesting is worth two spaces in one note and four in the next, so
 * depth is read off the parse tree and drawn at a fixed step instead — see
 * `.cm-list-line`. A quote already owns its line's left edge, rule and padding,
 * so a list inside one keeps the marker but leaves the indent alone rather than
 * setting the same properties twice.
 */
function listPosition(node: SyntaxNode): { depth: number; quoted: boolean } {
  let depth = -1
  let quoted = false
  for (let cur: SyntaxNode | null = node; cur; cur = cur.parent) {
    if (cur.name === 'BulletList' || cur.name === 'OrderedList') depth += 1
    else if (cur.name === 'Blockquote') quoted = true
  }
  return { depth: Math.max(depth, 0), quoted }
}

const listLines: Decoration[] = []

function listLine(depth: number): Decoration {
  // Past a handful of levels the indent is unreadable anyway, and the cap keeps
  // a pathological document from growing the cache without bound.
  const level = Math.min(depth, 8)
  listLines[level] ??= Decoration.line({
    class: 'cm-list-line',
    attributes: { style: `--list-depth:${level}` },
  })
  return listLines[level]
}

function codeLine(first: boolean, last: boolean) {
  const edges = `${first ? ' cm-code-start' : ''}${last ? ' cm-code-end' : ''}`
  return Decoration.line({ class: `cm-code-line${edges}` })
}

/** `==highlight==`, which is not part of CommonMark or GFM. */
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

/** Reveal a folded marker only when the selection actually enters that marker. */
function selectionTouches(view: EditorView, from: number, to: number): boolean {
  if (!view.hasFocus) return false
  return view.state.selection.ranges.some((range) =>
    range.empty
      ? range.head >= from && range.head < to
      : range.from < to && range.to > from,
  )
}

function build(view: EditorView): DecorationSets {
  const decorations: Range<Decoration>[] = []
  const hidden: Range<Decoration>[] = []
  const replacements: Range<Decoration>[] = []
  const doc = view.state.doc
  const tree = syntaxTree(view.state)

  const fold = (from: number, to: number) => {
    if (from < to && !selectionTouches(view, from, to)) {
      hidden.push(hiddenMark.range(from, to))
    }
  }

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
          if (node.name.startsWith('ATX')) {
            for (const range of headingMarkRanges(line.text)) {
              fold(line.from + range.from, line.from + range.to)
            }
          }
          return
        }
        if (node.name === 'Blockquote') {
          const first = doc.lineAt(node.from).number
          const last = doc.lineAt(Math.max(node.from, node.to - 1)).number
          for (let n = first; n <= last; n += 1) {
            decorations.push(quoteLine.range(doc.line(n).from))
          }
        }
        if (node.name === 'FencedCode' || node.name === 'CodeBlock') {
          const first = doc.lineAt(node.from).number
          const last = doc.lineAt(Math.max(node.from, node.to - 1)).number
          for (let n = first; n <= last; n += 1) {
            decorations.push(codeLine(n === first, n === last).range(doc.line(n).from))
          }
        }
        if (node.name === 'ListMark') {
          const line = doc.lineAt(node.from)
          // On `- [ ] task` the checkbox below already replaces the marker as
          // part of the todo, so a bullet here would fight it for the range.
          // Ordered markers keep their text: `1.` carries the number.
          const bullet =
            BULLET_RE.test(doc.sliceString(node.from, node.to)) && !TODO_RE.test(line.text)
          // The bullet goes in with the marks rather than the replacements:
          // that second set is also the atomic one, and the cursor has to be
          // able to sit inside a bullet to retype or delete it.
          decorations.push((bullet ? bulletMark : listMark).range(node.from, node.to))

          const { depth, quoted } = listPosition(node.node)
          if (!quoted) {
            decorations.push(listLine(depth).range(line.from))
            // The line draws its own indent now, so the source's leading spaces
            // would land on top of it. They stay hidden rather than folding
            // back on selection: an indent carries no information a reader
            // needs to see, and revealing it would shunt the line sideways on
            // every click.
            const indent = /^[ \t]*/.exec(line.text)?.[0].length ?? 0
            if (indent > 0 && line.from + indent <= node.from) {
              hidden.push(hiddenMark.range(line.from, line.from + indent))
            }
          }
        }
        if (SYNTAX_MARK_NODES.test(node.name)) {
          let markTo = node.to
          // A quote's separating space is structural too; folding it keeps the
          // rendered text aligned with the quote rule.
          if (node.name === 'QuoteMark' && doc.sliceString(markTo, markTo + 1) === ' ') {
            markTo += 1
          }
          fold(node.from, markTo)
        }
        if (node.name === 'CodeInfo') fold(node.from, node.to)
        if (
          node.name === 'URL' &&
          doc.sliceString(node.from - 1, node.from) === '(' &&
          doc.sliceString(node.to, node.to + 1) === ')'
        ) {
          fold(node.from, node.to)
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
          fold(start, start + 2)
          fold(start + match[0].length - 2, start + match[0].length)
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

export interface SlateDecorationOptions {
  onTagClick: (tag: string) => void
}

export function slateDecorations(options: SlateDecorationOptions) {
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
