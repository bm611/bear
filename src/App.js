import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { NoteList } from './components/NoteList';
import { EditorPane } from './components/EditorPane';
import { ShortcutsSheet } from './components/ShortcutsSheet';
import { TagDialogs } from './components/TagDialogs';
import { Toast } from './components/Toast';
import { AuthScreen } from './components/AuthScreen';
import { LandingScreen } from './components/LandingScreen';
import { SlateMark } from './components/Icons';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { useVisibleNotes } from './hooks/useVisibleNotes';
import { NARROW_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { hasMod } from './lib/platform';
const FONT_STACKS = {
    sans: 'var(--font-ui)',
    inter: 'var(--font-inter)',
    system: 'var(--font-system)',
    mono: 'var(--font-mono)',
};
/** Keeps `data-theme` on the root element in sync with the preference. */
function useTheme() {
    const theme = useStore((state) => state.preferences.theme);
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
            document.documentElement.dataset.theme = resolved;
            document
                .querySelector('meta[name="theme-color"]')
                ?.setAttribute('content', resolved === 'dark' ? '#24232f' : '#f7f7f7');
        };
        apply();
        if (theme !== 'system')
            return;
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);
}
function useTypography() {
    const font = useStore((state) => state.preferences.font);
    const fontSize = useStore((state) => state.preferences.fontSize);
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--editor-font', FONT_STACKS[font]);
        root.style.setProperty('--editor-font-size', `${fontSize}px`);
    }, [font, fontSize]);
}
/** Loads the signed-in user's notes on sign-in, and clears them on sign-out. */
function useNotesSync() {
    const status = useAuthStore((state) => state.status);
    const userId = useAuthStore((state) => state.session?.user.id ?? null);
    const hydrateNotes = useStore((state) => state.hydrateNotes);
    const resetNotes = useStore((state) => state.resetNotes);
    const notesHydrated = useStore((state) => state.notesHydrated);
    const notesError = useStore((state) => state.notesError);
    useEffect(() => {
        if (status === 'signedIn' && userId) {
            void hydrateNotes(userId);
        }
        else if (status === 'signedOut') {
            resetNotes();
        }
    }, [status, userId, hydrateNotes, resetNotes]);
    return {
        ready: status === 'signedIn' && notesHydrated,
        error: status === 'signedIn' ? notesError : null,
        retry: () => {
            if (userId)
                void hydrateNotes(userId);
        },
    };
}
function BootScreen({ title, body, action, }) {
    return (_jsxs("div", { className: "boot-screen", role: "status", "aria-live": "polite", children: [_jsx("span", { className: "boot-mark", children: _jsx(SlateMark, { size: 28 }) }), _jsx("h1", { children: title }), body ? _jsx("p", { children: body }) : null, action ? (_jsx("button", { type: "button", className: "button button-primary", onClick: action.onClick, children: action.label })) : null] }));
}
export function App() {
    useTheme();
    useTypography();
    const authStatus = useAuthStore((state) => state.status);
    const { ready: notesReady, error: notesError, retry } = useNotesSync();
    const [entry, setEntry] = useState('landing');
    const [authMode, setAuthMode] = useState('signUp');
    if (authStatus === 'loading') {
        return _jsx(BootScreen, { title: "Wiping the slate\u2026" });
    }
    if (authStatus !== 'signedIn') {
        if (entry === 'landing') {
            return (_jsx(LandingScreen, { onLaunch: (mode) => {
                    setAuthMode(mode);
                    setEntry('auth');
                } }));
        }
        return (_jsx(AuthScreen, { initialMode: authMode, onBack: () => setEntry('landing') }, authMode));
    }
    if (notesError) {
        return (_jsx(BootScreen, { title: "Couldn't load your notes", body: notesError, action: { label: 'Try again', onClick: retry } }));
    }
    if (!notesReady) {
        return _jsx(BootScreen, { title: "Fetching your notes\u2026" });
    }
    return _jsx(AppShell, {});
}
function AppShell() {
    const notes = useStore((state) => state.notes);
    const selectedId = useStore((state) => state.selectedId);
    const preferences = useStore((state) => state.preferences);
    const newNote = useStore((state) => state.newNote);
    const selectNote = useStore((state) => state.selectNote);
    const togglePin = useStore((state) => state.togglePin);
    const trashNote = useStore((state) => state.trashNote);
    const setPreferences = useStore((state) => state.setPreferences);
    const showToast = useStore((state) => state.showToast);
    const visible = useVisibleNotes();
    const note = notes.find((candidate) => candidate.id === selectedId) ?? null;
    const viewRef = useRef(null);
    const searchRef = useRef(null);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [mobilePane, setMobilePane] = useState('list');
    // Below the breakpoint the two panes stack: one at a time.
    const narrow = useMediaQuery(NARROW_QUERY);
    const listOpen = narrow ? mobilePane === 'list' : preferences.listVisible;
    const editorOpen = narrow ? mobilePane === 'editor' : true;
    const openNote = useCallback(() => {
        setMobilePane('editor');
    }, []);
    const showList = useCallback(() => {
        setMobilePane('list');
    }, []);
    const focusEditor = useCallback(() => {
        // Wait for the pane to mount the new document before taking focus.
        requestAnimationFrame(() => viewRef.current?.focus());
    }, []);
    const createNote = useCallback(() => {
        newNote();
        openNote();
        focusEditor();
    }, [focusEditor, newNote, openNote]);
    const step = useCallback((delta) => {
        if (visible.length === 0)
            return;
        const index = visible.findIndex((candidate) => candidate.id === selectedId);
        const next = index === -1 ? 0 : Math.min(visible.length - 1, Math.max(0, index + delta));
        selectNote(visible[next].id);
    }, [visible, selectedId, selectNote]);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (!hasMod(event) || event.repeat)
                return;
            const target = event.target;
            const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
            switch (event.key.toLowerCase()) {
                case 'n':
                    if (event.shiftKey)
                        return;
                    event.preventDefault();
                    createNote();
                    return;
                case 'f':
                    event.preventDefault();
                    setMobilePane('list');
                    if (!preferences.listVisible)
                        setPreferences({ listVisible: true });
                    requestAnimationFrame(() => searchRef.current?.focus());
                    return;
                case '2':
                    if (event.altKey)
                        return;
                    event.preventDefault();
                    if (narrow)
                        setMobilePane((pane) => (pane === 'list' ? 'editor' : 'list'));
                    else
                        setPreferences({ listVisible: !preferences.listVisible });
                    return;
                case '/':
                    event.preventDefault();
                    setShortcutsOpen((open) => !open);
                    return;
                case 'p':
                    if (!event.shiftKey || !note)
                        return;
                    event.preventDefault();
                    togglePin(note.id);
                    return;
                case 'backspace':
                    if (inField || !note || note.trashedAt !== null)
                        return;
                    event.preventDefault();
                    trashNote(note.id);
                    showToast('Moved to trash');
                    return;
                case 'arrowup':
                    if (!event.altKey)
                        return;
                    event.preventDefault();
                    step(-1);
                    return;
                case 'arrowdown':
                    if (!event.altKey)
                        return;
                    event.preventDefault();
                    step(1);
                    return;
                default:
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [
        createNote,
        narrow,
        note,
        preferences.listVisible,
        setPreferences,
        showToast,
        step,
        togglePin,
        trashNote,
    ]);
    return (_jsxs("div", { className: "app", children: [listOpen ? (_jsx(NoteList, { searchRef: searchRef, onOpenNote: () => {
                    openNote();
                    focusEditor();
                }, onShowShortcuts: () => setShortcutsOpen(true) })) : null, editorOpen ? (_jsx(EditorPane, { note: note, viewRef: viewRef, onBack: narrow ? () => setMobilePane('list') : undefined, onTagNavigate: narrow ? showList : undefined })) : null, shortcutsOpen ? _jsx(ShortcutsSheet, { onClose: () => setShortcutsOpen(false) }) : null, _jsx(TagDialogs, {}), _jsx(Toast, {})] }));
}
