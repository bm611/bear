import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { slateDecorations, headingMarkRanges } from './decorations'

/** Replaces the folded ranges with `·` so the expectations read like the line. */
function folded(text: string) {
  let out = ''
  let pos = 0
  for (const range of headingMarkRanges(text)) {
    out += text.slice(pos, range.from) + '·'
    pos = range.to
  }
  return out + text.slice(pos)
}

describe('headingMarkRanges', () => {
  it('folds the hashes and the space after them', () => {
    expect(folded('# Title')).toBe('·Title')
    expect(folded('###### Small')).toBe('·Small')
  })

  it('folds a closing sequence too', () => {
    expect(folded('## Title ##')).toBe('·Title·')
  })

  it('folds the indent a heading is allowed to carry', () => {
    expect(folded('   ## Title')).toBe('·Title')
  })

  it('leaves a heading that is only markers alone', () => {
    expect(headingMarkRanges('#')).toEqual([])
    expect(headingMarkRanges('#   ')).toEqual([])
  })

  it('leaves lines that are not ATX headings alone', () => {
    expect(headingMarkRanges('#hashtag')).toEqual([])
    expect(headingMarkRanges('Just prose')).toEqual([])
    expect(headingMarkRanges('####### Seven hashes')).toEqual([])
  })

  it('keeps a trailing hashtag, which is not a closing sequence', () => {
    expect(folded('# Title #work')).toBe('·Title #work')
    expect(folded('# Title #reading list#')).toBe('·Title #reading list#')
  })

  it('keeps hashes inside the heading text', () => {
    expect(folded('# C# and F#, mostly')).toBe('·C# and F#, mostly')
  })
})

function mountedEditor(doc: string): EditorView {
  const parent = document.createElement('div')
  document.body.append(parent)
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [markdown(), slateDecorations({ onTagClick: () => {} })],
    }),
  })
}

describe('slateDecorations', () => {
  it('folds rendered emphasis and link syntax in the editor', () => {
    const view = mountedEditor('**bold** and *italic* with [a link](https://example.com)')
    expect(view.contentDOM.textContent).toBe('bold and italic with a link')
    view.destroy()
  })

  it('lets the checkbox own its click instead of moving the editor cursor', () => {
    const view = mountedEditor('- [ ] task')
    const checkbox = view.contentDOM.querySelector<HTMLElement>('.cm-todo')
    expect(checkbox).not.toBeNull()

    checkbox?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))

    expect(view.state.doc.toString()).toBe('- [x] task')
    expect(view.state.selection.main.head).toBe(0)
    view.destroy()
  })
})
