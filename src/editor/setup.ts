import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, indentLess, indentMore, redo, undo } from '@codemirror/commands'
import { markdown, markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown'
import { indentUnit } from '@codemirror/language'
import { Compartment, EditorState, type Extension, Prec } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
  placeholder,
  rectangularSelection,
} from '@codemirror/view'
import {
  insertCodeBlock,
  insertHorizontalRule,
  insertLink,
  insertTable,
  setHeading,
  toggleBold,
  toggleBulletList,
  toggleHighlight,
  toggleInlineCode,
  toggleItalic,
  toggleNumberedList,
  toggleQuote,
  toggleStrikethrough,
  toggleTodo,
} from './commands'
import { slateDecorations } from './decorations'
import { slateTables, nextTableCell, previousTableCell } from './tables'
import { slateSyntax } from './theme'
import { tagCompletion, type TagSuggestion } from './tagComplete'

export const readOnlyCompartment = new Compartment()

/**
 * Undo/redo without CodeMirror's `Mod-u` = undoSelection binding: for a
 * character key, CodeMirror looks up the unshifted name first, so `Mod-u`
 * swallows `Mod-Shift-U` (todo) and undoes the last edit instead.
 */
const undoKeymap = keymap.of([
  { key: 'Mod-z', run: undo, preventDefault: true },
  { key: 'Mod-Shift-z', run: redo, preventDefault: true },
  { key: 'Mod-y', mac: 'Mod-Shift-y', run: redo, preventDefault: true },
])

const formattingKeymap = keymap.of([
  { key: 'Mod-b', run: toggleBold },
  { key: 'Mod-i', run: toggleItalic },
  { key: 'Mod-Shift-x', run: toggleStrikethrough },
  { key: 'Mod-Shift-h', run: toggleHighlight },
  { key: 'Mod-e', run: toggleInlineCode },
  { key: 'Mod-Shift-e', run: insertCodeBlock },
  { key: 'Mod-k', run: insertLink },
  { key: 'Mod-Shift-u', run: toggleTodo },
  { key: 'Mod-Shift-8', run: toggleBulletList },
  { key: 'Mod-Shift-7', run: toggleNumberedList },
  { key: 'Mod-Shift-.', run: toggleQuote },
  { key: 'Mod-Shift--', run: insertHorizontalRule },
  { key: 'Mod-Alt-t', run: insertTable },
  { key: 'Mod-Alt-1', run: setHeading(1) },
  { key: 'Mod-Alt-2', run: setHeading(2) },
  { key: 'Mod-Alt-3', run: setHeading(3) },
  { key: 'Mod-Alt-4', run: setHeading(4) },
  { key: 'Mod-Alt-5', run: setHeading(5) },
  { key: 'Mod-Alt-6', run: setHeading(6) },
  // Before the indent binding: inside a table, Tab walks the cells, and only
  // falls through to indenting when the cursor is somewhere else.
  { key: 'Tab', run: nextTableCell, shift: previousTableCell },
  { key: 'Tab', run: indentMore, shift: indentLess },
  {
    key: 'Escape',
    run: (view) => {
      view.contentDOM.blur()
      return true
    },
  },
])

export interface EditorSetupOptions {
  onChange: (text: string) => void
  onTagClick: (tag: string) => void
  getTags: () => TagSuggestion[]
  readOnly: boolean
}

export function slateSetup(options: EditorSetupOptions): Extension[] {
  return [
    history(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    highlightSpecialChars(),
    EditorView.lineWrapping,
    EditorState.allowMultipleSelections.of(true),
    indentUnit.of('    '),
    closeBrackets(),
    markdown({ base: markdownLanguage, addKeymap: false }),
    slateSyntax,
    slateDecorations({ onTagClick: options.onTagClick }),
    slateTables(),
    tagCompletion(options.getTags),
    placeholder('Start writing…'),
    Prec.high(formattingKeymap),
    Prec.high(undoKeymap),
    keymap.of([...closeBracketsKeymap, ...markdownKeymap, ...defaultKeymap]),
    readOnlyCompartment.of(EditorState.readOnly.of(options.readOnly)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) options.onChange(update.state.doc.toString())
    }),
  ]
}
