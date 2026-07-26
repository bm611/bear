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
const hashtagMark = Decoration.mark({ class: 'cm-hashtag' })
const todoDoneMark = Decoration.mark({ class: 'cm-todo-done' })

function build(view: EditorView): DecorationSets {
  const decorations: Range<Decoration>[] = []
  const replacements: Range<Decoration>[] = []
  const doc = view.state.doc
  const tree = syntaxTree(view.state)

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(node.name)
        if (heading) {
          decorations.push(lineClass(heading[1]).range(doc.lineAt(node.from).from))
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
      }
      if (line.to >= doc.length) break
      pos = line.to + 1
    }
  }

  return {
    all: Decoration.set([...decorations, ...replacements], true),
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
        if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
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
