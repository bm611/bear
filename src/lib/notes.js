import { parseTags } from './tags';
let counter = 0;
export function createId() {
    counter += 1;
    const random = Math.random().toString(36).slice(2, 8);
    return `${Date.now().toString(36)}-${counter.toString(36)}-${random}`;
}
export function createNote(text = '', now = Date.now()) {
    return {
        id: createId(),
        text,
        createdAt: now,
        updatedAt: now,
        pinned: false,
        archived: false,
        trashedAt: null,
    };
}
/** Strips the markdown syntax that would otherwise leak into titles and previews. */
export function stripMarkdown(line) {
    return line
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s{0,3}>\s?/, '')
        .replace(/^\s{0,3}([-*+]|\d+[.)])\s+/, '')
        .replace(/^\[[ xX]\]\s*/, '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/==(.*?)==/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/, '')
        .trim();
}
export const UNTITLED = 'Untitled Note';
/** The first line of the note doubles as its title. */
export function noteTitle(note) {
    for (const line of note.text.split('\n')) {
        const title = stripMarkdown(line);
        if (title)
            return title;
    }
    return UNTITLED;
}
/** The snippet shown under the title in the note list. */
export function notePreview(note) {
    const lines = note.text.split('\n');
    let titleSeen = false;
    const parts = [];
    for (const line of lines) {
        const clean = stripMarkdown(line);
        if (!clean)
            continue;
        if (!titleSeen) {
            titleSeen = true;
            continue;
        }
        parts.push(clean);
        if (parts.join(' ').length > 140)
            break;
    }
    return parts.join(' ').slice(0, 200);
}
export function wordCount(text) {
    const words = text.trim().match(/[\p{L}\p{N}'’-]+/gu);
    return words ? words.length : 0;
}
export function characterCount(text) {
    return [...text].length;
}
/** Minutes to read, at a leisurely 200 words per minute. */
export function readingTime(text) {
    return Math.max(1, Math.round(wordCount(text) / 200));
}
const TODO_RE = /^\s*(?:[-*+]\s*)?\[( |x|X)\]\s?/;
export function todoStats(text) {
    let total = 0;
    let done = 0;
    for (const line of text.split('\n')) {
        const match = TODO_RE.exec(line);
        if (!match)
            continue;
        total += 1;
        if (match[1] !== ' ')
            done += 1;
    }
    return { total, done };
}
export function hasOpenTodo(text) {
    const { total, done } = todoStats(text);
    return total > done;
}
export function isEmptyNote(note) {
    // New notes begin with an empty H1 so their first typed line is already a
    // title. Treat that scaffold like a blank draft when navigating away.
    return note.text.replace(/^#\s*(?:\n|$)/, '').trim().length === 0;
}
export function startOfToday(now = Date.now()) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}
export function sortNotes(notes, mode) {
    const byMode = (a, b) => {
        switch (mode) {
            case 'created':
                return b.createdAt - a.createdAt;
            case 'title':
                return noteTitle(a).localeCompare(noteTitle(b), undefined, { sensitivity: 'base' });
            case 'modified':
            default:
                return b.updatedAt - a.updatedAt;
        }
    };
    return [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned)
            return a.pinned ? -1 : 1;
        return byMode(a, b);
    });
}
/** Tags of a note, cached per (id, text) pair since parsing runs on every render. */
const tagCache = new Map();
export function noteTags(note) {
    const cached = tagCache.get(note.id);
    if (cached && cached.text === note.text)
        return cached.tags;
    const tags = parseTags(note.text);
    tagCache.set(note.id, { text: note.text, tags });
    return tags;
}
