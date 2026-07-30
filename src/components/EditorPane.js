import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Editor } from './Editor';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu';
import { ConfirmDialog } from './Dialog';
import { ArchiveIcon, BoldIcon, BulletIcon, ChevronRight, ClipboardIcon, CodeIcon, CopyIcon, DownloadIcon, ItalicIcon, LinkIcon, ListIcon, MoreIcon, PinIcon, QuoteIcon, RestoreIcon, TableIcon, TodoIcon, TrashIcon, } from './Icons';
import { NO_FORMATS, insertCodeBlock, insertLink, insertTable, setHeading, toggleBold, toggleBulletList, toggleItalic, toggleQuote, toggleTodo, } from '../editor/commands';
import { useElementWidth } from '../hooks/useElementWidth';
import { noteTitle } from '../lib/notes';
import { exportNoteHtml, slugify } from '../lib/markdown';
import { copyToClipboard, downloadFile } from '../lib/download';
import { combo, mod, ALT, MOD, SHIFT, BACKSPACE } from '../lib/platform';
/** Ordered by how often the formatting is reached for; tier 3 goes first. */
const FORMAT_ACTIONS = [
    {
        id: 'bold',
        label: 'Bold',
        shortcut: mod('B'),
        icon: _jsx(BoldIcon, {}),
        command: toggleBold,
        state: 'bold',
        tier: 1,
    },
    {
        id: 'italic',
        label: 'Italic',
        shortcut: mod('I'),
        icon: _jsx(ItalicIcon, {}),
        command: toggleItalic,
        state: 'italic',
        tier: 1,
    },
    {
        id: 'todo',
        label: 'Todo',
        shortcut: combo(MOD, SHIFT, 'U'),
        icon: _jsx(TodoIcon, {}),
        command: toggleTodo,
        state: 'todo',
        tier: 2,
    },
    {
        id: 'bullet',
        label: 'Bulleted list',
        shortcut: combo(MOD, SHIFT, '8'),
        icon: _jsx(BulletIcon, {}),
        command: toggleBulletList,
        state: 'bullet',
        tier: 2,
    },
    {
        id: 'quote',
        label: 'Quote',
        shortcut: combo(MOD, SHIFT, '.'),
        icon: _jsx(QuoteIcon, {}),
        command: toggleQuote,
        state: 'quote',
        tier: 3,
    },
    {
        id: 'code',
        label: 'Code block',
        shortcut: combo(MOD, SHIFT, 'E'),
        icon: _jsx(CodeIcon, {}),
        command: insertCodeBlock,
        tier: 3,
    },
    {
        id: 'table',
        label: 'Table',
        shortcut: combo(MOD, ALT, 'T'),
        icon: _jsx(TableIcon, {}),
        command: insertTable,
        tier: 3,
    },
    {
        id: 'link',
        label: 'Link',
        shortcut: mod('K'),
        icon: _jsx(LinkIcon, {}),
        command: insertLink,
        tier: 3,
    },
];
/** Toolbar widths below which the formatting controls stop fitting in a row. */
const ROOMY_WIDTH = 620;
const MEDIUM_WIDTH = 460;
function toolbarTier(width) {
    if (width > ROOMY_WIDTH)
        return 3;
    if (width > MEDIUM_WIDTH)
        return 2;
    return 1;
}
export function EditorPane({ note, viewRef, onBack, onTagNavigate }) {
    const preferences = useStore((state) => state.preferences);
    const setPreferences = useStore((state) => state.setPreferences);
    const togglePin = useStore((state) => state.togglePin);
    const toggleArchive = useStore((state) => state.toggleArchive);
    const trashNote = useStore((state) => state.trashNote);
    const restoreNote = useStore((state) => state.restoreNote);
    const deleteForever = useStore((state) => state.deleteForever);
    const duplicateNote = useStore((state) => state.duplicateNote);
    const showToast = useStore((state) => state.showToast);
    const [menuOpen, setMenuOpen] = useState(false);
    const [headingOpen, setHeadingOpen] = useState(false);
    const [overflowOpen, setOverflowOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [formats, setFormats] = useState(NO_FORMATS);
    const toolbarRef = useRef(null);
    /** Toolbar clicks steal focus; stash the selection so commands still see it. */
    const pendingSelection = useRef(null);
    const tier = toolbarTier(useElementWidth(toolbarRef));
    const trashed = note?.trashedAt !== null && note !== null;
    const readOnly = trashed;
    useEffect(() => {
        setHeadingOpen(false);
        setMenuOpen(false);
        setOverflowOpen(false);
        setScrolled(false);
    }, [note?.id]);
    // Shade the toolbar's bottom edge once content scrolls beneath it.
    useEffect(() => {
        const scroller = viewRef.current?.scrollDOM;
        if (!scroller)
            return;
        const onScroll = () => setScrolled(scroller.scrollTop > 4);
        onScroll();
        scroller.addEventListener('scroll', onScroll, { passive: true });
        return () => scroller.removeEventListener('scroll', onScroll);
    }, [note?.id, viewRef]);
    if (!note) {
        return (_jsx("section", { className: "editor-pane", "aria-label": "Editor", children: _jsxs("div", { className: "empty-state", children: [_jsx("h2", { children: "No note selected" }), _jsxs("p", { children: ["Pick a note from the list, or press ", _jsx("kbd", { children: mod('N') }), " to write a new one."] })] }) }));
    }
    const title = noteTitle(note);
    const inlineActions = FORMAT_ACTIONS.filter((action) => tier >= action.tier);
    const overflowActions = FORMAT_ACTIONS.filter((action) => tier < action.tier);
    const stashSelection = () => {
        const view = viewRef.current;
        if (view)
            pendingSelection.current = view.state.selection;
    };
    const run = (command) => () => {
        const view = viewRef.current;
        if (!view || readOnly)
            return;
        const saved = pendingSelection.current;
        pendingSelection.current = null;
        view.focus();
        if (saved)
            view.dispatch({ selection: saved });
        command(view);
        view.focus();
    };
    const keepEditorFocus = (event) => {
        event.preventDefault();
        stashSelection();
    };
    const exportMarkdown = () => {
        downloadFile(`${slugify(title)}.md`, note.text, 'text/markdown');
        showToast('Markdown file downloaded');
    };
    const exportHtml = () => {
        downloadFile(`${slugify(title)}.html`, exportNoteHtml(title, note.text), 'text/html');
        showToast('HTML file downloaded');
    };
    const copyMarkdown = async () => {
        const ok = await copyToClipboard(note.text);
        showToast(ok ? 'Markdown copied' : 'Clipboard unavailable');
    };
    return (_jsxs("section", { className: "editor-pane", "aria-label": "Editor", children: [_jsxs("div", { className: "editor-toolbar", "data-scrolled": scrolled ? 'true' : 'false', ref: toolbarRef, children: [onBack ? (_jsx("button", { type: "button", className: "icon-button", "aria-label": "Back to list", onClick: onBack, children: _jsx(ChevronRight, { size: 16, style: { transform: 'rotate(180deg)' } }) })) : null, _jsx("div", { className: "toolbar-group desktop-only", role: "group", "aria-label": "Panes", children: _jsx("button", { type: "button", className: "icon-button", "aria-label": "Toggle note list", "aria-pressed": preferences.listVisible, title: `Toggle note list (${mod('2')})`, onClick: () => setPreferences({ listVisible: !preferences.listVisible }), children: _jsx(ListIcon, {}) }) }), !readOnly ? (_jsxs("div", { className: "toolbar-group", role: "group", "aria-label": "Formatting", children: [_jsxs("div", { className: "menu-anchor", children: [_jsxs("button", { type: "button", className: "icon-button toolbar-heading", "data-active": formats.heading !== null ? 'true' : undefined, "aria-label": formats.heading === null ? 'Heading level' : `Heading level ${formats.heading}`, "aria-expanded": headingOpen, title: "Heading level", onMouseDown: keepEditorFocus, onClick: () => setHeadingOpen((open) => !open), children: [_jsx("span", { className: "toolbar-heading-level", children: formats.heading === null ? 'H' : `H${formats.heading}` }), _jsx(ChevronRight, { size: 11, className: "toolbar-heading-caret" })] }), headingOpen ? (_jsx(Menu, { label: "Heading level", align: "left", restoreFocus: false, onClose: () => setHeadingOpen(false), style: { top: '2.3rem' }, children: [1, 2, 3, 4, 5, 6].map((level) => (_jsxs(MenuItem, { checked: formats.heading === level, shortcut: combo(MOD, '⌥', String(level)), onSelect: () => {
                                                setHeadingOpen(false);
                                                run(setHeading(level))();
                                            }, children: ["Heading ", level] }, level))) })) : null] }), inlineActions.map((action) => (_jsx("button", { type: "button", className: "icon-button", "aria-label": action.label, "aria-pressed": action.state ? formats[action.state] : undefined, title: `${action.label} (${action.shortcut})`, onMouseDown: keepEditorFocus, onClick: run(action.command), children: action.icon }, action.id))), overflowActions.length > 0 ? (_jsxs("div", { className: "menu-anchor", children: [_jsx("button", { type: "button", className: "icon-button", "aria-label": "More formatting", "aria-expanded": overflowOpen, title: "More formatting", onMouseDown: keepEditorFocus, onClick: () => setOverflowOpen((open) => !open), children: _jsx(MoreIcon, {}) }), overflowOpen ? (_jsx(Menu, { label: "More formatting", 
                                        // Right-aligned: this menu only exists in a narrow pane,
                                        // where opening leftward is what keeps it on screen.
                                        align: "right", restoreFocus: false, onClose: () => setOverflowOpen(false), style: { top: '2.3rem' }, children: overflowActions.map((action) => (_jsx(MenuItem, { icon: action.icon, checked: action.state ? formats[action.state] : undefined, shortcut: action.shortcut, onSelect: () => {
                                                setOverflowOpen(false);
                                                run(action.command)();
                                            }, children: action.label }, action.id))) })) : null] })) : null] })) : null, _jsx("span", { className: "toolbar-spacer" }), _jsxs("div", { className: "toolbar-group", role: "group", "aria-label": "Note", children: [_jsx("button", { type: "button", className: "icon-button", "aria-label": note.pinned ? 'Unpin note' : 'Pin note', "aria-pressed": note.pinned, title: `${note.pinned ? 'Unpin' : 'Pin'} (${combo(MOD, SHIFT, 'P')})`, onClick: () => togglePin(note.id), children: _jsx(PinIcon, {}) }), _jsxs("div", { className: "menu-anchor", children: [_jsx("button", { type: "button", className: "icon-button", "aria-label": "Note actions", "aria-expanded": menuOpen, onClick: () => setMenuOpen((open) => !open), children: _jsx(MoreIcon, {}) }), menuOpen ? (_jsxs(Menu, { label: "Note actions", onClose: () => setMenuOpen(false), style: { top: '2.3rem' }, children: [_jsx(MenuItem, { icon: _jsx(CopyIcon, { size: 15 }), onSelect: () => {
                                                    setMenuOpen(false);
                                                    duplicateNote(note.id);
                                                }, children: "Duplicate note" }), _jsx(MenuItem, { icon: _jsx(ClipboardIcon, { size: 15 }), onSelect: () => {
                                                    setMenuOpen(false);
                                                    void copyMarkdown();
                                                }, children: "Copy as markdown" }), _jsx(MenuSeparator, {}), _jsx(MenuLabel, { children: "Export" }), _jsx(MenuItem, { icon: _jsx(DownloadIcon, { size: 15 }), onSelect: () => {
                                                    setMenuOpen(false);
                                                    exportMarkdown();
                                                }, children: "Markdown (.md)" }), _jsx(MenuItem, { icon: _jsx(DownloadIcon, { size: 15 }), onSelect: () => {
                                                    setMenuOpen(false);
                                                    exportHtml();
                                                }, children: "Web page (.html)" }), _jsx(MenuSeparator, {}), trashed ? (_jsxs(_Fragment, { children: [_jsx(MenuItem, { icon: _jsx(RestoreIcon, { size: 15 }), onSelect: () => {
                                                            setMenuOpen(false);
                                                            restoreNote(note.id);
                                                        }, children: "Restore note" }), _jsx(MenuItem, { danger: true, icon: _jsx(TrashIcon, { size: 15 }), onSelect: () => {
                                                            setMenuOpen(false);
                                                            setConfirmDelete(true);
                                                        }, children: "Delete permanently\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsx(MenuItem, { icon: _jsx(ArchiveIcon, { size: 15 }), onSelect: () => {
                                                            setMenuOpen(false);
                                                            toggleArchive(note.id);
                                                            showToast(note.archived ? 'Moved out of archive' : 'Moved to archive');
                                                        }, children: note.archived ? 'Move out of archive' : 'Archive note' }), _jsx(MenuItem, { danger: true, icon: _jsx(TrashIcon, { size: 15 }), shortcut: combo(MOD, BACKSPACE), onSelect: () => {
                                                            setMenuOpen(false);
                                                            trashNote(note.id);
                                                            showToast('Moved to trash');
                                                        }, children: "Move to trash" })] }))] })) : null] })] })] }), trashed ? (_jsxs("div", { className: "banner", role: "status", children: ["This note is in the trash.", _jsxs("span", { className: "banner-actions", children: [_jsx("button", { type: "button", onClick: () => restoreNote(note.id), children: "Put back" }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(true), children: "Delete now" })] })] })) : note.archived ? (_jsxs("div", { className: "banner", role: "status", children: ["Archived.", _jsx("span", { className: "banner-actions", children: _jsx("button", { type: "button", onClick: () => toggleArchive(note.id), children: "Move out of archive" }) })] })) : null, _jsx(Editor, { noteId: note.id, text: note.text, readOnly: readOnly, viewRef: viewRef, onTagNavigate: onTagNavigate, onFormatsChange: setFormats }), confirmDelete ? (_jsx(ConfirmDialog, { title: "Delete this note?", description: `“${title}” will be deleted permanently. This cannot be undone.`, confirmLabel: "Delete permanently", destructive: true, onCancel: () => setConfirmDelete(false), onConfirm: () => {
                    deleteForever(note.id);
                    setConfirmDelete(false);
                } })) : null] }));
}
