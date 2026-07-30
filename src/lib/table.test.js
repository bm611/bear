import { describe, expect, it } from 'vitest';
import { cellIndexAt, createTable, formatRow, formatTable, isDelimiterRow, rowAligns, rowLayout, rowValues, tableAt, withColumn, withRow, withoutColumn, withoutRow, } from './table';
const TABLE = ['| Name | Age |', '| --- | ---: |', '| Ada | 36 |', '| Alan | 41 |'];
describe('rowLayout', () => {
    it('spans the text between the pipes, padding included', () => {
        const { pipes, cells } = rowLayout('| a | b |');
        expect(pipes).toEqual([0, 4, 8]);
        expect(cells).toEqual([
            { from: 1, to: 4 },
            { from: 5, to: 8 },
        ]);
    });
    it('does not invent a cell after the closing pipe', () => {
        expect(rowValues('| a | b |')).toEqual(['a', 'b']);
        expect(rowValues('| a | b |  ')).toEqual(['a', 'b']);
    });
    it('reads rows that leave the outer pipes off', () => {
        expect(rowValues('a | b')).toEqual(['a', 'b']);
        expect(rowValues('| a | b')).toEqual(['a', 'b']);
        expect(rowValues('a | b |')).toEqual(['a', 'b']);
    });
    it('keeps an escaped pipe inside its cell', () => {
        expect(rowValues('| a \\| b | c |')).toEqual(['a \\| b', 'c']);
    });
    it('gives an empty cell a span of its own', () => {
        expect(rowValues('|  |  |')).toEqual(['', '']);
        expect(rowLayout('|  |  |').cells).toHaveLength(2);
    });
});
describe('isDelimiterRow', () => {
    it('accepts the shapes GFM allows', () => {
        expect(isDelimiterRow('| --- | --- |')).toBe(true);
        expect(isDelimiterRow('| :--- | ---: | :-: |')).toBe(true);
        expect(isDelimiterRow('|-|-|')).toBe(true);
    });
    it('rejects anything with content in it', () => {
        expect(isDelimiterRow('| a | --- |')).toBe(false);
        expect(isDelimiterRow('|  |  |')).toBe(false);
        expect(isDelimiterRow('no pipes here')).toBe(false);
    });
});
describe('formatting', () => {
    it('leaves an empty cell two spaces to hold a cursor', () => {
        expect(formatRow(['a', ''])).toBe('| a |  |');
    });
    it('writes a blank table of the requested size', () => {
        expect(createTable(2, 2).split('\n')).toEqual(['|  |  |', '| --- | --- |', '|  |  |']);
    });
    it('round-trips a table through the model', () => {
        const table = tableAt(TABLE, 2);
        expect(table && formatTable(table).split('\n')).toEqual(TABLE);
    });
});
describe('tableAt', () => {
    it('finds the table from any of its lines', () => {
        for (const line of [0, 1, 2, 3]) {
            expect(tableAt(TABLE, line)).toMatchObject({ start: 0, end: 3 });
        }
    });
    it('reads the header, the body and the alignment', () => {
        expect(tableAt(TABLE, 2)).toMatchObject({
            aligns: ['none', 'right'],
            rows: [
                ['Name', 'Age'],
                ['Ada', '36'],
                ['Alan', '41'],
            ],
        });
    });
    it('squares ragged rows off against the header', () => {
        const lines = ['| a | b |', '| --- | --- |', '| one |', '| x | y | z |'];
        expect(tableAt(lines, 2)?.rows).toEqual([
            ['a', 'b'],
            ['one', ''],
            ['x', 'y'],
        ]);
    });
    it('stops at the lines around the table', () => {
        const lines = ['intro', ...TABLE, '', 'after | with a pipe'];
        expect(tableAt(lines, 3)).toMatchObject({ start: 1, end: 4 });
        expect(tableAt(lines, 0)).toBeNull();
        expect(tableAt(lines, 5)).toBeNull();
        expect(tableAt(lines, 6)).toBeNull();
    });
    it('needs a delimiter row to call something a table', () => {
        expect(tableAt(['| a | b |', '| c | d |'], 0)).toBeNull();
    });
    it('does not read a delimiter row as the header of its own table', () => {
        expect(tableAt(['| --- | --- |', '| a | b |'], 1)).toBeNull();
    });
});
describe('cellIndexAt', () => {
    it('reports the cell an offset falls in', () => {
        expect(cellIndexAt('| a | b |', 2)).toBe(0);
        expect(cellIndexAt('| a | b |', 6)).toBe(1);
    });
});
describe('rows and columns', () => {
    const table = tableAt(TABLE, 2);
    it('inserts a blank row', () => {
        expect(formatTable(withRow(table, 1)).split('\n')[2]).toBe('|  |  |');
        expect(withRow(table, 1).rows).toHaveLength(4);
    });
    it('never pushes a row above the header', () => {
        expect(withRow(table, 0).rows[0]).toEqual(['Name', 'Age']);
    });
    it('deletes a row, and gives up when the last one goes', () => {
        expect(withoutRow(table, 1)?.rows).toEqual([
            ['Name', 'Age'],
            ['Alan', '41'],
        ]);
        expect(withoutRow({ ...table, rows: [table.rows[0]] }, 0)).toBeNull();
    });
    it('inserts a column into every row, alignment included', () => {
        const next = withColumn(table, 1);
        expect(next.aligns).toEqual(['none', 'none', 'right']);
        expect(next.rows[1]).toEqual(['Ada', '', '36']);
    });
    it('deletes a column, and gives up when the last one goes', () => {
        const next = withoutColumn(table, 0);
        expect(next?.aligns).toEqual(['right']);
        expect(next?.rows).toEqual([['Age'], ['36'], ['41']]);
        expect(withoutColumn({ ...table, aligns: ['none'], rows: [['a']] }, 0)).toBeNull();
    });
});
describe('rowAligns', () => {
    it('reads the colons off a delimiter row', () => {
        expect(rowAligns('| --- | :-- | --: | :-: |')).toEqual(['none', 'left', 'right', 'center']);
    });
});
