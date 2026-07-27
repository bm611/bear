import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/**
 * Markdown is styled in place rather than in a separate preview. Structural
 * markers are folded by `decorations.ts` and reveal themselves only when the
 * selection enters one, so the document remains fully editable.
 */
export const bearHighlightStyle = HighlightStyle.define([
  // Bear's H1 is twice the body size — 34px against 17px copy — and the rest
  // of the ramp steps down from there rather than from the body size up.
  { tag: t.heading1, fontSize: '2em', fontWeight: '700', lineHeight: '1.4' },
  { tag: t.heading2, fontSize: '1.55em', fontWeight: '700', lineHeight: '1.35' },
  { tag: t.heading3, fontSize: '1.25em', fontWeight: '600' },
  { tag: t.heading4, fontSize: '1.1em', fontWeight: '600' },
  { tag: [t.heading5, t.heading6], fontWeight: '600', color: 'var(--text-secondary)' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--text-tertiary)' },
  { tag: t.link, color: 'var(--accent)', textDecoration: 'underline', textDecorationColor: 'var(--accent-soft)' },
  { tag: t.url, color: 'var(--text-tertiary)', textDecoration: 'none' },
  { tag: t.quote, color: 'var(--text-secondary)', fontStyle: 'italic' },
  { tag: t.monospace, fontFamily: 'var(--font-mono)', fontSize: '0.92em', color: 'var(--code-text)' },
  { tag: t.list, color: 'var(--text-primary)' },
  { tag: t.atom, color: 'var(--accent)' },
  { tag: t.contentSeparator, color: 'var(--text-tertiary)' },
  { tag: t.labelName, color: 'var(--text-tertiary)' },
  { tag: t.escape, color: 'var(--text-tertiary)' },
  // HeaderMark, EmphasisMark, ListMark, QuoteMark, CodeMark, LinkMark… Lezer
  // tags the markers as part of their parent too, so `~~` would otherwise be
  // struck through and `[` underlined. Last rule wins, so reset that here.
  {
    tag: t.processingInstruction,
    color: 'var(--syntax-mark)',
    fontWeight: '400',
    textDecoration: 'none',
  },
])

export const bearEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--editor-font-size)',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--editor-font)',
    // Bear runs its 17px body copy on a 30px baseline. Every line sits on that
    // grid — blank paragraph lines and list rows included — so the one value
    // reproduces the native editor's vertical rhythm end to end: a blank line
    // in the source is exactly one line of air, with no extra block margins.
    lineHeight: '1.765',
    padding: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  '.cm-content': {
    padding: '2.2rem 0 45vh',
    caretColor: 'var(--accent)',
    maxWidth: 'var(--editor-measure)',
    margin: '0 auto',
    width: '100%',
  },
  '.cm-line': { padding: '0 1px 0 0' },
  // Bear sets every list marker in a fixed slot: the marker itself sits a
  // little way in from the paragraph margin and the copy starts at ~2.2em, so
  // bullets, numbers and checkboxes all line their text up with each other.
  // `min-width` rather than `width` so a long `10.` pushes out instead of
  // overlapping its own line.
  '.cm-list-marker': {
    display: 'inline-block',
    minWidth: '1.97em',
    paddingLeft: '0.53em',
  },
  '.cm-bullet': {
    display: 'inline-block',
    width: '1.97em',
  },
  // A hanging indent, so a bullet that wraps keeps its later rows under the
  // copy instead of running back out to the marker. The negative indent is
  // what the marker slot above sits in, so the two have to stay in step.
  //
  // One step per level of nesting, which puts a nested bullet exactly under the
  // copy of the item it belongs to. `--list-depth` comes from the line
  // decoration, and the source's own leading spaces are hidden so that the step
  // is the same whether the note indents by two spaces or by four.
  '.cm-list-line': {
    paddingLeft: 'calc((1 + var(--list-depth, 0)) * 2.15em)',
    textIndent: '-2.15em',
  },
  // `text-indent` inherits, and each marker is an inline-block of its own, so
  // without this the markers take the outdent a second time and land off the
  // left edge of the note.
  '.cm-list-line .cm-bullet, .cm-list-line .cm-list-marker': {
    textIndent: '0',
  },
  // Measured off Bear: a 6px dot against 17px copy, resting 2.5px above the
  // baseline. Drawn rather than typed — a `•` is a different size in each of
  // the three editor fonts, and lands differently against the baseline too.
  '.cm-bullet-dot': {
    display: 'inline-block',
    width: '0.35em',
    height: '0.35em',
    marginLeft: '0.53em',
    verticalAlign: '0.15em',
    borderRadius: '50%',
    backgroundColor: 'var(--list-marker)',
  },
  // A ListMark is `processingInstruction` to Lezer, so the highlight style
  // paints it as Markdown punctuation — but it does so in a span of its own
  // *inside* this one, and a child that sets its own colour never inherits the
  // parent's. Colouring the wrapper alone leaves the glyph grey no matter how
  // important the declaration is, so name the child as well.
  '.cm-list-marker, .cm-list-marker span': {
    color: 'var(--list-marker) !important',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftWidth: '2px', borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection)',
  },
  '.cm-placeholder': { color: 'var(--text-tertiary)', fontStyle: 'normal' },

  // Headings get breathing room above them, like a typeset page. The `em` here
  // resolves against the line's own 17px, not the heading's, so these stay in
  // step with the body rhythm rather than growing with the heading.
  //
  // Bear leaves ~40px between an H1 baseline and the line under it, about ten
  // more than the H1 line box alone accounts for; the padding below makes up
  // the difference, and survives the `:first-child` reset so a note's title
  // keeps its air.
  '.cm-heading-1': { paddingTop: '1.1em', paddingBottom: '0.55em' },
  '.cm-heading-2': { paddingTop: '0.95em' },
  '.cm-heading-3, .cm-heading-4, .cm-heading-5, .cm-heading-6': { paddingTop: '0.7em' },
  '.cm-line.cm-heading-1:first-child, .cm-line.cm-heading-2:first-child': { paddingTop: '0' },

  '.cm-quote-line': {
    borderLeft: '3px solid var(--rule)',
    paddingLeft: '0.85em',
    marginLeft: '-1px',
  },
  '.cm-code-line': {
    backgroundColor: 'var(--code-bg)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92em',
    paddingLeft: '0.9em',
    paddingRight: '0.9em',
  },
  '.cm-code-start': {
    marginTop: '0.8em',
    paddingTop: '0.5em',
    borderRadius: '8px 8px 0 0',
  },
  '.cm-code-end': {
    marginBottom: '0.9em',
    paddingBottom: '0.5em',
    borderRadius: '0 0 8px 8px',
  },
  '.cm-code-start.cm-code-end': {
    borderRadius: '8px',
  },

  '.cm-hashtag': {
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-wash)',
    borderRadius: '5px',
    padding: '0.1em 0.32em',
    margin: '0 -0.05em',
    cursor: 'pointer',
    fontWeight: '500',
  },
  '.cm-hashtag:hover': { backgroundColor: 'var(--accent-wash-strong)' },

  '.cm-highlight': {
    backgroundColor: 'var(--highlight)',
    borderRadius: '3px',
    padding: '0.08em 0',
  },

  '.cm-todo': {
    display: 'inline-block',
    width: '1.05em',
    height: '1.05em',
    // Into the same marker slot as a bullet, so a mixed list stays flush.
    marginLeft: '0.53em',
    marginRight: '0.45em',
    verticalAlign: '-0.16em',
    border: '1.5px solid var(--todo-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 120ms ease, border-color 120ms ease',
  },
  '.cm-todo:hover': { borderColor: 'var(--accent)' },
  '.cm-todo-checked': { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' },
  '.cm-todo-checked::after': {
    content: '""',
    position: 'absolute',
    left: '0.28em',
    top: '0.1em',
    width: '0.26em',
    height: '0.52em',
    border: '2px solid #fff',
    borderTop: '0',
    borderLeft: '0',
    transform: 'rotate(40deg)',
  },
  '.cm-todo-done': { color: 'var(--text-tertiary)', textDecoration: 'line-through' },

  '.cm-tooltip': {
    border: '1px solid var(--rule)',
    borderRadius: '10px',
    backgroundColor: 'var(--surface-raised)',
    boxShadow: 'var(--shadow-pop)',
    overflow: 'hidden',
    fontFamily: 'var(--font-ui)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.85rem',
    maxHeight: '14rem',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '0.32rem 0.7rem' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: '#fff',
  },
  '.cm-completionLabel': { fontFamily: 'var(--font-ui)' },
  '.cm-completionDetail': { color: 'var(--text-tertiary)', fontStyle: 'normal', marginLeft: '0.6em' },
})

export const bearSyntax = [syntaxHighlighting(bearHighlightStyle), bearEditorTheme]
