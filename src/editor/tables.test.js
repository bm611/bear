import { describe, expect, it } from 'vitest';
import { EditorSelection, EditorState } from '@codemirror/state';
import { applyTableAction, nextTableCell, previousTableCell } from './tables';
/** Same stand-in as `commands.test.ts`: these only touch state and dispatch. */
function harness(doc, cursor) {
    let state = EditorState.create({ doc, selection: EditorSelection.single(cursor) });
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
            return command(view);
        },
        act(pos, action) {
            return applyTableAction(view, pos, action);
        },
        get lines() {
            return state.doc.toString().split('\n');
        },
        get head() {
            return state.selection.main.head;
        },
        /** The cursor's cell, as `row/column`, for readable expectations. */
        get cell() {
            const line = state.doc.lineAt(state.selection.main.head);
            const before = line.text.slice(0, state.selection.main.head - line.from);
            return `${line.number}/${(before.match(/\|/g)?.length ?? 0) - 1}`;
        },
    };
}
const TABLE = ['| Region | Revenue |', '| --- | --- |', '| North | 4,120 |'].join('\n');
describe('nextTableCell', () => {
    it('steps to the next cell in the row', () => {
        const h = harness(TABLE, 5);
        expect(h.run(nextTableCell)).toBe(true);
        expect(h.cell).toBe('1/1');
    });
    it('steps over the delimiter row into the body', () => {
        const h = harness(TABLE, 15);
        h.run(nextTableCell);
        expect(h.cell).toBe('3/0');
    });
    it('lands after the text already in the cell', () => {
        const h = harness(TABLE, 5);
        h.run(nextTableCell);
        expect(h.lines[0].slice(0, h.head)).toBe('| Region | Revenue');
    });
    it('adds a row when there is no cell left to move to', () => {
        const h = harness(TABLE, TABLE.length - 3);
        expect(h.run(nextTableCell)).toBe(true);
        expect(h.lines).toEqual([...TABLE.split('\n'), '|  |  |']);
        expect(h.cell).toBe('4/0');
    });
    it('leaves Tab alone outside a table', () => {
        expect(harness('plain text', 3).run(nextTableCell)).toBe(false);
    });
});
describe('previousTableCell', () => {
    it('steps back over the delimiter row into the header', () => {
        const h = harness(TABLE, 37);
        expect(h.run(previousTableCell)).toBe(true);
        expect(h.cell).toBe('1/1');
    });
    it('stays put in the first cell rather than indenting', () => {
        const h = harness(TABLE, 5);
        expect(h.run(previousTableCell)).toBe(true);
        expect(h.lines).toEqual(TABLE.split('\n'));
    });
});
describe('applyTableAction', () => {
    it('inserts a row under the one asked for', () => {
        const h = harness(TABLE, 5);
        expect(h.act(5, 'row-below')).toBe(true);
        expect(h.lines).toEqual(['| Region | Revenue |', '| --- | --- |', '|  |  |', '| North | 4,120 |']);
    });
    it('never inserts a row above the header', () => {
        const h = harness(TABLE, 5);
        h.act(5, 'row-above');
        expect(h.lines[0]).toBe('| Region | Revenue |');
        expect(h.lines[2]).toBe('|  |  |');
    });
    it('inserts a column into every row and puts the cursor in it', () => {
        const h = harness(TABLE, 5);
        h.act(5, 'column-right');
        expect(h.lines).toEqual([
            '| Region |  | Revenue |',
            '| --- | --- | --- |',
            '| North |  | 4,120 |',
        ]);
        expect(h.cell).toBe('1/1');
    });
    it('deletes the row the cell is in', () => {
        const h = harness(TABLE, 37);
        h.act(37, 'delete-row');
        expect(h.lines).toEqual(['| Region | Revenue |', '| --- | --- |']);
    });
    it('deletes the column the cell is in', () => {
        const h = harness(TABLE, 5);
        h.act(5, 'delete-column');
        expect(h.lines).toEqual(['| Revenue |', '| --- |', '| 4,120 |']);
    });
    it('deletes the whole table without leaving a blank line', () => {
        const h = harness(`before\n\n${TABLE}\n\nafter`, 'before\n\n'.length + 5);
        h.act('before\n\n'.length + 5, 'delete-table');
        expect(h.lines).toEqual(['before', '', '', 'after']);
    });
    it('takes the table with it when its last row is deleted', () => {
        const doc = ['| a |', '| --- |'].join('\n');
        const h = harness(doc, 2);
        h.act(2, 'delete-row');
        expect(h.lines).toEqual(['']);
    });
    it('does nothing outside a table', () => {
        expect(harness('plain text', 3).act(3, 'delete-row')).toBe(false);
    });
});
