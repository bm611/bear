import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useVisibleNotes } from '../hooks/useVisibleNotes';
import { noteTitle, notePreview, todoStats, UNTITLED } from '../lib/notes';
import { listDate } from '../lib/date';
import { mod } from '../lib/platform';
import { ConfirmDialog } from './Dialog';
import { LibraryPanel } from './LibraryPanel';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu';
import { Popover } from './Popover';
import { SettingsMenu } from './SettingsMenu';
import { ChevronDown, CloseIcon, MoreIcon, PinIcon, PlusIcon, SearchIcon, SettingsIcon, SlateMark, TodoIcon, TrashIcon, } from './Icons';
function filterTitle(filter) {
    switch (filter.kind) {
        case 'all':
            return 'Notes';
        case 'untagged':
            return 'Untagged';
        case 'todo':
            return 'Todo';
        case 'today':
            return 'Today';
        case 'archive':
            return 'Archive';
        case 'trash':
            return 'Trash';
        case 'tag':
            return `#${filter.tag}`;
    }
}
export function NoteList({ searchRef, onOpenNote, onShowShortcuts }) {
    const filter = useStore((state) => state.filter);
    const notes = useStore((state) => state.notes);
    const query = useStore((state) => state.query);
    const selectedId = useStore((state) => state.selectedId);
    const sort = useStore((state) => state.preferences.sort);
    const setQuery = useStore((state) => state.setQuery);
    const selectNote = useStore((state) => state.selectNote);
    const newNote = useStore((state) => state.newNote);
    const setPreferences = useStore((state) => state.setPreferences);
    const emptyTrash = useStore((state) => state.emptyTrash);
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const listRef = useRef(null);
    const libraryTriggerRef = useRef(null);
    const settingsTriggerRef = useRef(null);
    const menuTriggerRef = useRef(null);
    const visible = useVisibleNotes();
    const liveCount = useMemo(() => notes.filter((note) => note.trashedAt === null && !note.archived).length, [notes]);
    // Keep the selected card in view when selection moves by keyboard.
    useEffect(() => {
        const node = listRef.current?.querySelector('[aria-current="true"]');
        node?.scrollIntoView({ block: 'nearest' });
    }, [selectedId, filter]);
    const sortOptions = [
        { value: 'modified', label: 'Date modified' },
        { value: 'created', label: 'Date created' },
        { value: 'title', label: 'Title' },
    ];
    const title = filterTitle(filter);
    const createNote = () => {
        newNote();
        onOpenNote?.();
    };
    return (_jsxs("section", { className: "note-list", "aria-label": `${title} notes`, children: [_jsxs("div", { className: "list-header", children: [_jsxs("div", { className: "list-brand-row", children: [_jsxs("span", { className: "list-brand", children: [_jsx(SlateMark, { size: 20 }), "Slate"] }), _jsx("div", { className: "list-brand-actions", children: _jsx("button", { type: "button", className: "icon-button", title: `New note (${mod('N')})`, "aria-label": "New note", onClick: createNote, children: _jsx(PlusIcon, {}) }) })] }), _jsxs("div", { className: "list-title-row", children: [_jsxs("div", { className: "list-title-group menu-anchor", children: [_jsx("h1", { className: "list-title", children: _jsxs("button", { ref: libraryTriggerRef, type: "button", className: "list-title-trigger", "aria-label": `${title} — browse library`, "aria-expanded": libraryOpen, title: title, onClick: () => setLibraryOpen((open) => !open), children: [_jsx("span", { className: "list-title-text", children: title }), _jsx(ChevronDown, { size: 14 })] }) }), libraryOpen ? (_jsx(Popover, { className: "library-popover", label: "Library", triggerRef: libraryTriggerRef, onClose: () => setLibraryOpen(false), children: _jsx(LibraryPanel, { onNavigate: () => setLibraryOpen(false) }) })) : null] }), _jsxs("div", { className: "list-title-actions menu-anchor", children: [_jsx("button", { ref: settingsTriggerRef, type: "button", className: "icon-button", "aria-label": "Settings", "aria-expanded": settingsOpen, title: "Settings", onClick: () => {
                                            setMenuOpen(false);
                                            setSettingsOpen((open) => !open);
                                        }, children: _jsx(SettingsIcon, {}) }), settingsOpen ? (_jsx(SettingsMenu, { style: { top: '2rem' }, align: "right", triggerRef: settingsTriggerRef, onClose: () => setSettingsOpen(false), onShowShortcuts: onShowShortcuts })) : null, _jsx("button", { ref: menuTriggerRef, type: "button", className: "icon-button", "aria-label": "List options", "aria-expanded": menuOpen, onClick: () => {
                                            setSettingsOpen(false);
                                            setMenuOpen((open) => !open);
                                        }, children: _jsx(MoreIcon, {}) }), menuOpen ? (_jsxs(Menu, { label: "List options", triggerRef: menuTriggerRef, onClose: () => setMenuOpen(false), style: { top: '2rem' }, children: [_jsx(MenuLabel, { children: "Sort by" }), sortOptions.map(({ value, label }) => (_jsx(MenuItem, { checked: sort === value, onSelect: () => setPreferences({ sort: value }), children: label }, value))), filter.kind === 'trash' ? (_jsxs(_Fragment, { children: [_jsx(MenuSeparator, {}), _jsx(MenuItem, { danger: true, icon: _jsx(TrashIcon, { size: 15 }), disabled: visible.length === 0, onSelect: () => {
                                                            setMenuOpen(false);
                                                            setConfirmEmpty(true);
                                                        }, children: "Empty trash\u2026" })] })) : null] })) : null] })] }), _jsxs("div", { className: "search-field", children: [_jsx(SearchIcon, { size: 14 }), _jsx("input", { ref: searchRef, type: "search", value: query, placeholder: "Search", "aria-label": "Search notes", spellCheck: false, onChange: (event) => setQuery(event.target.value), onKeyDown: (event) => {
                                    if (event.key === 'Escape') {
                                        event.stopPropagation();
                                        if (query)
                                            setQuery('');
                                        else
                                            event.currentTarget.blur();
                                    }
                                    if (event.key === 'ArrowDown' && visible.length > 0) {
                                        event.preventDefault();
                                        selectNote(visible[0].id);
                                        listRef.current?.querySelector('.note-card')?.focus();
                                    }
                                } }), query ? (_jsx("button", { type: "button", className: "icon-button", "aria-label": "Clear search", onClick: () => setQuery(''), children: _jsx(CloseIcon, { size: 13 }) })) : null] })] }), _jsx("div", { className: "list-scroll scroll-host", ref: listRef, children: visible.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("h2", { children: query ? 'No matches' : 'Nothing here yet' }), _jsx("p", { children: query
                                ? 'Try a different word, or search a #tag.'
                                : filter.kind === 'trash'
                                    ? 'Deleted notes will collect here.'
                                    : `Press ${mod('N')} to start a new note.` })] })) : (visible.map((note) => (_jsx(NoteCard, { note: note, selected: note.id === selectedId, onSelect: () => {
                        selectNote(note.id);
                        onOpenNote?.();
                    } }, note.id)))) }), _jsx("div", { className: "list-footer", children: _jsxs("span", { className: "list-footer-count", children: [liveCount, " note", liveCount === 1 ? '' : 's'] }) }), confirmEmpty ? (_jsx(ConfirmDialog, { title: "Empty trash?", description: `${visible.length} note${visible.length === 1 ? '' : 's'} will be deleted permanently. This cannot be undone.`, confirmLabel: "Delete permanently", destructive: true, onCancel: () => setConfirmEmpty(false), onConfirm: () => {
                    emptyTrash();
                    setConfirmEmpty(false);
                } })) : null] }));
}
function NoteCard({ note, selected, onSelect }) {
    const title = noteTitle(note);
    const preview = notePreview(note);
    const todos = todoStats(note.text);
    return (_jsxs("button", { type: "button", className: "note-card", "aria-current": selected ? 'true' : undefined, onClick: onSelect, "data-note-id": note.id, children: [_jsxs("span", { className: "note-card-top", children: [_jsx("span", { className: "note-card-title", style: title === UNTITLED ? { opacity: 0.55 } : undefined, children: title }), note.pinned ? (_jsx("span", { className: "note-card-icon", title: "Pinned", children: _jsx(PinIcon, { size: 13 }) })) : null, _jsx("span", { className: "note-card-date", children: listDate(note.updatedAt) })] }), preview ? _jsx("span", { className: "note-card-preview", children: preview }) : null, todos.total > 0 ? (_jsxs("span", { className: "note-card-meta", children: [_jsx(TodoIcon, { size: 12 }), todos.done, "/", todos.total] })) : null] }));
}
