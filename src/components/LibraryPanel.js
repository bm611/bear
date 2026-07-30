import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { buildTagTree } from '../lib/tags';
import { matchesFilter } from '../lib/search';
import { TagTree } from './TagTree';
import { ArchiveIcon, NotesIcon, TodayIcon, TodoIcon, TrashIcon, UntaggedIcon, } from './Icons';
const SMART_FILTERS = [
    { filter: { kind: 'all' }, label: 'Notes', icon: _jsx(NotesIcon, { size: 15 }) },
    { filter: { kind: 'todo' }, label: 'Todo', icon: _jsx(TodoIcon, { size: 15 }) },
    { filter: { kind: 'today' }, label: 'Today', icon: _jsx(TodayIcon, { size: 15 }) },
    { filter: { kind: 'untagged' }, label: 'Untagged', icon: _jsx(UntaggedIcon, { size: 15 }) },
    { filter: { kind: 'archive' }, label: 'Archive', icon: _jsx(ArchiveIcon, { size: 15 }) },
    { filter: { kind: 'trash' }, label: 'Trash', icon: _jsx(TrashIcon, { size: 15 }) },
];
function sameFilter(a, b) {
    if (a.kind !== b.kind)
        return false;
    if (a.kind === 'tag' && b.kind === 'tag')
        return a.tag.toLowerCase() === b.tag.toLowerCase();
    return true;
}
/**
 * Smart filters and the tag tree — everything needed to pick what the note list
 * shows, dropped from the note list's title. The list header around it supplies
 * the title, the new-note button and settings.
 */
export function LibraryPanel({ onNavigate }) {
    const notes = useStore((state) => state.notes);
    const filter = useStore((state) => state.filter);
    const setFilter = useStore((state) => state.setFilter);
    const openTagDialog = useStore((state) => state.openTagDialog);
    const scrollRef = useRef(null);
    // Deep in a nested tag the selected row can open below the fold, which matters
    // for the popover: it is short and gets reopened constantly.
    useEffect(() => {
        scrollRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
    }, []);
    const liveNotes = useMemo(() => notes.filter((note) => note.trashedAt === null && !note.archived), [notes]);
    const tagTree = useMemo(() => buildTagTree(liveNotes), [liveNotes]);
    const counts = useMemo(() => {
        const now = Date.now();
        const result = new Map();
        for (const { filter: smart } of SMART_FILTERS) {
            result.set(smart.kind, notes.filter((note) => matchesFilter(note, smart, now)).length);
        }
        return result;
    }, [notes]);
    return (_jsxs("div", { className: "sidebar-scroll scroll-host", ref: scrollRef, children: [SMART_FILTERS.map(({ filter: smart, label, icon }) => {
                const count = counts.get(smart.kind) ?? 0;
                if (count === 0 && (smart.kind === 'archive' || smart.kind === 'trash'))
                    return null;
                return (_jsxs("div", { className: "tag-row-wrapper", children: [_jsx("span", { className: "disclosure", "aria-hidden": "true" }), _jsxs("button", { type: "button", className: "sidebar-row", "aria-current": sameFilter(filter, smart) ? 'true' : undefined, onClick: () => {
                                setFilter(smart);
                                onNavigate?.();
                            }, children: [_jsx("span", { className: "sidebar-row-icon", children: icon }), _jsx("span", { className: "sidebar-row-label", children: label }), _jsx("span", { className: "count-badge", children: count })] })] }, smart.kind));
            }), tagTree.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "sidebar-section-label", children: "Tags" }), _jsx(TagTree, { nodes: tagTree, filter: filter, onSelect: (tag) => {
                            setFilter({ kind: 'tag', tag });
                            onNavigate?.();
                        }, 
                        // The dialogs live at the app root, so dismissing the popover first
                        // leaves them standing.
                        onRename: (tag) => {
                            onNavigate?.();
                            openTagDialog({ kind: 'rename', tag });
                        }, onDelete: (tag) => {
                            onNavigate?.();
                            openTagDialog({ kind: 'delete', tag });
                        } })] })) : null] }));
}
