import { describe, expect, it } from 'vitest';
import { buildTagTree, matchTagRanges, parseTags, removeTagFromText, renameTagInText, tagMatches, tagWithAncestors, } from './tags';
import { createNote } from './notes';
describe('parseTags', () => {
    it('finds plain and nested hashtags', () => {
        expect(parseTags('Shopping list #errands #home/kitchen')).toEqual(['errands', 'home/kitchen']);
    });
    it('accepts multi-word tags closed with a second hash', () => {
        expect(parseTags('Finished #reading list# last night')).toEqual(['reading list']);
    });
    it('reads a tag at the very start of the note', () => {
        expect(parseTags('#inbox and the rest')).toEqual(['inbox']);
    });
    it('ignores markdown headings', () => {
        expect(parseTags('# Heading\n## Subheading\ntext')).toEqual([]);
    });
    it('ignores hashes inside words and URLs', () => {
        expect(parseTags('issue a#b and https://example.com/x#anchor')).toEqual([]);
        expect(parseTags('see [spec](https://example.com/#top)')).toEqual([]);
    });
    it('ignores hashtags inside code', () => {
        expect(parseTags('use `#notatag` here')).toEqual([]);
        expect(parseTags('```\n#nope\n```\n#yes')).toEqual(['yes']);
        expect(parseTags('~~~js\n#nope\n~~~')).toEqual([]);
    });
    it('drops trailing punctuation', () => {
        expect(parseTags('filed under #work, and #home.')).toEqual(['work', 'home']);
        expect(parseTags('(see #ideas)')).toEqual(['ideas']);
    });
    it('deduplicates case-insensitively but keeps the first spelling', () => {
        expect(parseTags('#Work #work #WORK')).toEqual(['Work']);
    });
    it('rejects tags without letters or digits', () => {
        expect(parseTags('#--- #/ #!')).toEqual([]);
    });
    it('handles two multi-word candidates on one line', () => {
        expect(parseTags('#work #reading list#')).toEqual(['work', 'reading list']);
    });
});
describe('matchTagRanges', () => {
    it('reports offsets that bound exactly the tag', () => {
        const text = 'a #work, b';
        const [match] = matchTagRanges(text);
        expect(text.slice(match.from, match.to)).toBe('#work');
    });
    it('includes the closing hash of a multi-word tag', () => {
        const text = 'x #two words# y';
        const [match] = matchTagRanges(text);
        expect(text.slice(match.from, match.to)).toBe('#two words#');
        expect(match.multiWord).toBe(true);
    });
});
describe('tag hierarchy', () => {
    it('expands ancestors', () => {
        expect(tagWithAncestors('a/b/c')).toEqual(['a', 'a/b', 'a/b/c']);
    });
    it('matches descendants but not siblings', () => {
        expect(tagMatches('work/projects', 'work')).toBe(true);
        expect(tagMatches('work', 'work')).toBe(true);
        expect(tagMatches('workshop', 'work')).toBe(false);
    });
    it('builds a tree whose parents count nested notes', () => {
        const notes = [
            createNote('one #work/projects/slate'),
            createNote('two #work/admin'),
            createNote('three #home'),
        ];
        const tree = buildTagTree(notes);
        expect(tree.map((node) => node.name)).toEqual(['home', 'work']);
        const work = tree.find((node) => node.name === 'work');
        expect(work?.count).toBe(2);
        expect(work?.children.map((node) => node.name)).toEqual(['admin', 'projects']);
        expect(work?.children.find((node) => node.name === 'projects')?.count).toBe(1);
    });
    it('counts a note once even when it repeats a tag', () => {
        const tree = buildTagTree([createNote('#work and again #work')]);
        expect(tree[0].count).toBe(1);
    });
});
describe('renameTagInText', () => {
    it('renames a tag and its descendants', () => {
        expect(renameTagInText('a #work b #work/admin c', 'work', 'job')).toBe('a #job b #job/admin c');
    });
    it('leaves similarly named tags alone', () => {
        expect(renameTagInText('#workshop', 'work', 'job')).toBe('#workshop');
    });
    it('keeps the multi-word form', () => {
        expect(renameTagInText('x #two words# y', 'two words', 'three words')).toBe('x #three words# y');
    });
    it('does not touch code spans', () => {
        expect(renameTagInText('`#work` #work', 'work', 'job')).toBe('`#work` #job');
    });
});
describe('removeTagFromText', () => {
    it('removes the tag and tidies the whitespace it leaves', () => {
        expect(removeTagFromText('Buy milk #errands', 'errands')).toBe('Buy milk');
    });
    it('removes nested tags too', () => {
        expect(removeTagFromText('#work/admin stays?', 'work')).toBe(' stays?');
    });
    it('keeps trailing punctuation that was never part of the tag', () => {
        expect(removeTagFromText('done #work.', 'work')).toBe('done .');
    });
});
