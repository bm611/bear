import { describe, expect, it } from 'vitest';
import { UNTITLED, createNote, hasOpenTodo, notePreview, noteTitle, readingTime, sortNotes, stripMarkdown, todoStats, wordCount, } from './notes';
function note(text, overrides = {}) {
    return { ...createNote(text), ...overrides };
}
describe('stripMarkdown', () => {
    it('removes block and inline syntax', () => {
        expect(stripMarkdown('## **Bold** heading')).toBe('Bold heading');
        expect(stripMarkdown('- [ ] a *task*')).toBe('a task');
        expect(stripMarkdown('> quoted `code`')).toBe('quoted code');
        expect(stripMarkdown('1. [link](https://x.dev)')).toBe('link');
        expect(stripMarkdown('~~gone~~ ==kept==')).toBe('gone kept');
    });
    it('drops horizontal rules', () => {
        expect(stripMarkdown('---')).toBe('');
    });
});
describe('noteTitle', () => {
    it('uses the first non-empty line', () => {
        expect(noteTitle(note('\n\n# Real title\nbody'))).toBe('Real title');
    });
    it('falls back for an empty note', () => {
        expect(noteTitle(note('   \n\n'))).toBe(UNTITLED);
    });
});
describe('notePreview', () => {
    it('skips the title line and joins the rest', () => {
        expect(notePreview(note('Title\n\nFirst line\nSecond line'))).toBe('First line Second line');
    });
    it('is empty for a single-line note', () => {
        expect(notePreview(note('Just a title'))).toBe('');
    });
});
describe('counting', () => {
    it('counts words and ignores punctuation', () => {
        expect(wordCount("It's a well-known fact, apparently.")).toBe(5);
        expect(wordCount('   ')).toBe(0);
    });
    it('reports at least one minute of reading', () => {
        expect(readingTime('short')).toBe(1);
        expect(readingTime('word '.repeat(400))).toBe(2);
    });
});
describe('todos', () => {
    it('counts open and done items in both bullet styles', () => {
        const text = '- [ ] one\n- [x] two\n[ ] three\n[X] four\nnot a todo';
        expect(todoStats(text)).toEqual({ total: 4, done: 2 });
        expect(hasOpenTodo(text)).toBe(true);
    });
    it('has no open todos when everything is ticked', () => {
        expect(hasOpenTodo('- [x] done')).toBe(false);
        expect(hasOpenTodo('nothing here')).toBe(false);
    });
});
describe('sortNotes', () => {
    const older = note('Alpha', { updatedAt: 1_000, createdAt: 3_000 });
    const newer = note('Zulu', { updatedAt: 2_000, createdAt: 1_000 });
    const pinned = note('Middle', { updatedAt: 500, createdAt: 500, pinned: true });
    it('floats pinned notes to the top', () => {
        const sorted = sortNotes([older, newer, pinned], 'modified');
        expect(sorted.map(noteTitle)).toEqual(['Middle', 'Zulu', 'Alpha']);
    });
    it('sorts by creation date', () => {
        const sorted = sortNotes([older, newer], 'created');
        expect(sorted.map(noteTitle)).toEqual(['Alpha', 'Zulu']);
    });
    it('sorts by title', () => {
        const sorted = sortNotes([newer, older], 'title');
        expect(sorted.map(noteTitle)).toEqual(['Alpha', 'Zulu']);
    });
    it('does not mutate the input', () => {
        const input = [older, newer];
        sortNotes(input, 'title');
        expect(input[0]).toBe(older);
    });
});
