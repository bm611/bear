import { describe, expect, it } from 'vitest';
import { EditorSelection, EditorState } from '@codemirror/state';
import { activeFormats, insertCodeBlock, insertHorizontalRule, insertLink, insertTable, setHeading, toggleBold, toggleBulletList, toggleInlineCode, toggleItalic, toggleNumberedList, toggleQuote, toggleTodo, } from './commands';
/**
 * The formatting commands only touch `view.state` and `view.dispatch`, so a
 * stand-in lets them be tested without a browser.
 */
function harness(doc, anchor, head = anchor) {
    let state = EditorState.create({ doc, selection: EditorSelection.single(anchor, head) });
    const view = {
        get state() {
            return state;
        },
        dispatch(...specs) {
            for (const spec of specs)
                state = state.update(spec).state;
        },
        focus() { },
    };
    return {
        view,
        run(command) {
            command(view);
            return state.doc.toString();
        },
        get text() {
            return state.doc.toString();
        },
        get selection() {
            return state.selection.main;
        },
    };
}
/** `|` marks the cursor, `«…»` a selection — markdown uses brackets itself. */
function at(doc) {
    const selection = /«([\s\S]*?)»/.exec(doc);
    if (selection) {
        const anchor = selection.index;
        return harness(doc.replace(/[«»]/g, ''), anchor, anchor + selection[1].length);
    }
    const cursor = doc.indexOf('|');
    return harness(doc.replace('|', ''), cursor === -1 ? 0 : cursor);
}
describe('toggleTodo', () => {
    it('turns the cursor line into a todo without touching the rest', () => {
        const h = at('Title\n\nA body line.|');
        expect(h.run(toggleTodo)).toBe('Title\n\n- [ ] A body line.');
    });
    it('keeps a cursor at the start of an empty todo after its marker', () => {
        const h = at('|');
        expect(h.run(toggleTodo)).toBe('- [ ] ');
        expect(h.selection.head).toBe(6);
    });
    it('is its own undo', () => {
        const h = at('- [ ] A body line.|');
        expect(h.run(toggleTodo)).toBe('A body line.');
    });
    it('keeps a ticked box when removing the marker', () => {
        const h = at('- [x] done|');
        expect(h.run(toggleTodo)).toBe('done');
    });
    it('replaces a bullet rather than nesting inside it', () => {
        const h = at('- shopping|');
        expect(h.run(toggleTodo)).toBe('- [ ] shopping');
    });
    it('converts every line of a multi-line selection', () => {
        const h = at('«one\ntwo\nthree»');
        expect(h.run(toggleTodo)).toBe('- [ ] one\n- [ ] two\n- [ ] three');
    });
    it('clears a whole selection of todos', () => {
        const h = at('«- [ ] one\n- [x] two»');
        expect(h.run(toggleTodo)).toBe('one\ntwo');
    });
    it('preserves indentation', () => {
        const h = at('    nested|');
        expect(h.run(toggleTodo)).toBe('    - [ ] nested');
    });
});
describe('list and quote commands', () => {
    it('toggles bullets', () => {
        const h = at('one|');
        expect(h.run(toggleBulletList)).toBe('- one');
        expect(h.run(toggleBulletList)).toBe('one');
    });
    it('numbers a selection sequentially', () => {
        const h = at('«a\nb\nc»');
        expect(h.run(toggleNumberedList)).toBe('1. a\n2. b\n3. c');
    });
    it('toggles quotes', () => {
        const h = at('quoted|');
        expect(h.run(toggleQuote)).toBe('> quoted');
        expect(h.run(toggleQuote)).toBe('quoted');
    });
    it('keeps a leading cursor after an inserted quote marker', () => {
        const h = at('|quoted');
        expect(h.run(toggleQuote)).toBe('> quoted');
        expect(h.selection.head).toBe(2);
    });
    it('does not disturb neighbouring lines', () => {
        const h = at('first\nsecond|\nthird');
        expect(h.run(toggleBulletList)).toBe('first\n- second\nthird');
    });
});
describe('setHeading', () => {
    it('applies and clears the same level', () => {
        const h = at('Title|');
        expect(h.run(setHeading(2))).toBe('## Title');
        expect(h.run(setHeading(2))).toBe('Title');
    });
    it('replaces a different level', () => {
        const h = at('### Deep|');
        expect(h.run(setHeading(1))).toBe('# Deep');
    });
});
describe('inline wrapping', () => {
    it('wraps a selection', () => {
        const h = at('make «this» bold');
        expect(h.run(toggleBold)).toBe('make **this** bold');
    });
    it('unwraps when the markers are already there', () => {
        const h = at('make **«this»** bold');
        expect(h.run(toggleBold)).toBe('make this bold');
    });
    it('leaves the cursor between fresh markers', () => {
        const h = at('start |');
        h.run(toggleItalic);
        expect(h.text).toBe('start **');
        expect(h.selection.head).toBe(7);
    });
    it('wraps code spans', () => {
        const h = at('run «npm test» now');
        expect(h.run(toggleInlineCode)).toBe('run `npm test` now');
    });
    it('keeps the selection over the wrapped text', () => {
        const h = at('a «word» b');
        h.run(toggleBold);
        expect(h.text.slice(h.selection.from, h.selection.to)).toBe('word');
    });
});
describe('insertLink', () => {
    it('wraps the selection and selects the url placeholder', () => {
        const h = at('see «the docs» please');
        expect(h.run(insertLink)).toBe('see [the docs](url) please');
        expect(h.text.slice(h.selection.from, h.selection.to)).toBe('url');
    });
    it('recognises a selected url', () => {
        const h = at('«https://example.com»');
        expect(h.run(insertLink)).toBe('[](https://example.com)');
        expect(h.selection.head).toBe(1);
    });
    it('recognises www urls', () => {
        const h = at('«www.example.com»');
        expect(h.run(insertLink)).toBe('[](www.example.com)');
        expect(h.selection.head).toBe(1);
    });
    it('inserts an empty link at the cursor', () => {
        const h = at('link here: |');
        expect(h.run(insertLink)).toBe('link here: [](url)');
    });
});
describe('insertHorizontalRule', () => {
    it('adds a rule after the current line', () => {
        const h = at('Some text|\nnext');
        expect(h.run(insertHorizontalRule)).toBe('Some text\n---\n\nnext');
    });
    it('does not add a blank line when the line is already empty', () => {
        const h = at('|');
        expect(h.run(insertHorizontalRule)).toBe('---\n');
    });
});
describe('insertTable', () => {
    it('writes a 2×2 table and puts the cursor in the first header cell', () => {
        const h = at('|');
        expect(h.run(insertTable)).toBe('|  |  |\n| --- | --- |\n|  |  |\n');
        expect(h.selection.head).toBe(2);
    });
    it('separates the table from the paragraph it follows', () => {
        const h = at('Some text|\nnext');
        expect(h.run(insertTable)).toBe('Some text\n\n|  |  |\n| --- | --- |\n|  |  |\n\nnext');
        expect(h.selection.head).toBe('Some text\n\n| '.length);
    });
});
describe('insertCodeBlock', () => {
    it('creates a complete fence and puts the cursor on its body line', () => {
        const h = at('|');
        expect(h.run(insertCodeBlock)).toBe('```\n\n```');
        expect(h.selection.head).toBe(4);
    });
    it('inserts a fenced block after a line with content', () => {
        const h = at('Some text|');
        expect(h.run(insertCodeBlock)).toBe('Some text\n```\n\n```');
        expect(h.selection.head).toBe('Some text\n```\n'.length);
    });
    it('places selected lines inside the fence', () => {
        const h = at('«const value = 1»');
        expect(h.run(insertCodeBlock)).toBe('```\nconst value = 1\n```');
        expect(h.selection.head).toBe(4);
    });
});
describe('activeFormats', () => {
    const formats = (doc) => activeFormats(at(doc).view.state);
    it('reports nothing on a plain line', () => {
        expect(formats('Just some prose.|')).toEqual({
            heading: null,
            bold: false,
            italic: false,
            todo: false,
            bullet: false,
            quote: false,
        });
    });
    it('reads the heading level off the cursor line', () => {
        expect(formats('### Section|').heading).toBe(3);
        expect(formats('#hashtag not a heading|').heading).toBe(null);
    });
    it('reports no heading when the selected lines disagree', () => {
        expect(formats('«# One\n## Two»').heading).toBe(null);
        expect(formats('«## One\n## Two»').heading).toBe(2);
    });
    it('reports bold and italics from the delimiters around the selection', () => {
        expect(formats('a **«bold»** b').bold).toBe(true);
        expect(formats('a *«italic»* b').italic).toBe(true);
        expect(formats('a «loose» b').bold).toBe(false);
    });
    it('does not read the inner star of a bold pair as italics', () => {
        expect(formats('**«bold»**').italic).toBe(false);
    });
    it('claims a todo line as a todo rather than a bullet', () => {
        expect(formats('- [ ] Task|')).toMatchObject({ todo: true, bullet: false });
        expect(formats('- Item|')).toMatchObject({ todo: false, bullet: true });
    });
    it('only reports a line format when every selected line has it', () => {
        expect(formats('«> One\n> Two»').quote).toBe(true);
        expect(formats('«> One\nTwo»').quote).toBe(false);
    });
    it('promises that a reported format is the one the command strips', () => {
        const h = at('«> Quoted»');
        expect(activeFormats(h.view.state).quote).toBe(true);
        expect(h.run(toggleQuote)).toBe('Quoted');
        expect(activeFormats(h.view.state).quote).toBe(false);
    });
});
