import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/**
 * Bear's trick: markdown is styled in place rather than in a preview pane, and
 * the syntax markers recede into the background instead of disappearing. The
 * exception is a heading's `#`, which `decorations.ts` folds away entirely
 * unless the cursor is on that line — see the note there.
 */
export const bearHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.65em', fontWeight: '700', lineHeight: '1.25' },
  { tag: t.heading2, fontSize: '1.35em', fontWeight: '700', lineHeight: '1.3' },
  { tag: t.heading3, fontSize: '1.18em', fontWeight: '600' },
  { tag: t.heading4, fontSize: '1.06em', fontWeight: '600' },
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
    lineHeight: '1.62',
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
  '.cm-cursor, .cm-dropCursor': { borderLeftWidth: '2px', borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--selection)',
  },
  '.cm-placeholder': { color: 'var(--text-tertiary)', fontStyle: 'normal' },

  // Headings get breathing room above them, like a typeset page.
  '.cm-heading-1': { paddingTop: '1.1em' },
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
