import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { EditorSelection, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { activeFormats } from '../editor/commands';
import { slateSetup, readOnlyCompartment } from '../editor/setup';
import { useStore } from '../store/useStore';
import { buildTagTree } from '../lib/tags';
function flattenTags(nodes, out = []) {
    for (const node of nodes) {
        out.push({ tag: node.path, count: node.count });
        flattenTags(node.children, out);
    }
    return out;
}
function initialSelection(text) {
    const firstLine = text.split('\n', 1)[0];
    return firstLine === '# ' ? EditorSelection.single(2) : undefined;
}
/**
 * Hosts the CodeMirror instance. One view is created for the lifetime of the
 * pane; switching notes swaps the state so undo history never leaks across
 * notes.
 */
export function Editor({ noteId, text, readOnly, viewRef, onTagNavigate, onFormatsChange, }) {
    const hostRef = useRef(null);
    const noteIdRef = useRef(noteId);
    const extensionsRef = useRef(null);
    const syncingRef = useRef(false);
    const scrollPositions = useRef(new Map());
    const readOnlyRef = useRef(readOnly);
    const onTagNavigateRef = useRef(onTagNavigate);
    onTagNavigateRef.current = onTagNavigate;
    const onFormatsChangeRef = useRef(onFormatsChange);
    onFormatsChangeRef.current = onFormatsChange;
    const updateNoteText = useStore((state) => state.updateNoteText);
    const setFilter = useStore((state) => state.setFilter);
    // Completion reads the store on demand, so the editor never needs rebuilding.
    // The note being edited is excluded: the half-typed `#rec` in front of the
    // cursor is a tag of this note, and suggesting it back is noise.
    const getTags = useMemo(() => () => {
        const live = useStore
            .getState()
            .notes.filter((note) => note.trashedAt === null && note.id !== noteIdRef.current);
        return flattenTags(buildTagTree(live)).sort((a, b) => b.count - a.count);
    }, []);
    useEffect(() => {
        const host = hostRef.current;
        if (!host)
            return;
        const extensions = slateSetup({
            onChange: (value) => {
                if (syncingRef.current)
                    return;
                updateNoteText(noteIdRef.current, value);
            },
            onTagClick: (tag) => {
                setFilter({ kind: 'tag', tag });
                onTagNavigateRef.current?.();
            },
            onFormatsChange: (formats) => onFormatsChangeRef.current?.(formats),
            getTags,
            readOnly: readOnlyRef.current,
        });
        extensionsRef.current = extensions;
        const view = new EditorView({
            parent: host,
            state: EditorState.create({ doc: text, selection: initialSelection(text), extensions }),
        });
        viewRef.current = view;
        // No update has run yet, so seed the toolbar from the starting state.
        onFormatsChangeRef.current?.(activeFormats(view.state));
        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // Created once on mount; note changes are handled by the effects below.
    }, [getTags, setFilter, updateNoteText, viewRef]);
    useEffect(() => {
        const view = viewRef.current;
        const extensions = extensionsRef.current;
        if (!view || !extensions)
            return;
        const switchingNotes = noteIdRef.current !== noteId;
        const currentText = view.state.doc.toString();
        if (!switchingNotes && currentText === text)
            return;
        syncingRef.current = true;
        try {
            if (switchingNotes) {
                scrollPositions.current.set(noteIdRef.current, view.scrollDOM.scrollTop);
                noteIdRef.current = noteId;
                view.setState(EditorState.create({ doc: text, selection: initialSelection(text), extensions }));
                view.dispatch({
                    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
                });
                view.scrollDOM.scrollTop = scrollPositions.current.get(noteId) ?? 0;
            }
            else {
                // An edit from outside the editor: a tag rename, or a todo ticked
                // somewhere else in the app.
                view.dispatch({ changes: { from: 0, to: currentText.length, insert: text } });
            }
        }
        finally {
            syncingRef.current = false;
        }
    }, [noteId, text, readOnly, viewRef]);
    useEffect(() => {
        readOnlyRef.current = readOnly;
        viewRef.current?.dispatch({
            effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
        });
    }, [readOnly, viewRef]);
    return _jsx("div", { className: "editor-host", ref: hostRef });
}
