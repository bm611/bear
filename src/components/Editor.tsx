import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { EditorSelection, EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { slateSetup, readOnlyCompartment } from '../editor/setup'
import type { TagSuggestion } from '../editor/tagComplete'
import { useStore } from '../store/useStore'
import { buildTagTree } from '../lib/tags'
import type { TagNode } from '../lib/types'

function flattenTags(nodes: TagNode[], out: TagSuggestion[] = []): TagSuggestion[] {
  for (const node of nodes) {
    out.push({ tag: node.path, count: node.count })
    flattenTags(node.children, out)
  }
  return out
}

interface EditorProps {
  noteId: string
  text: string
  readOnly: boolean
  viewRef: RefObject<EditorView | null>
  /** Fired after a hashtag pill is clicked (e.g. to show the filtered list on mobile). */
  onTagNavigate?: () => void
}

function initialSelection(text: string): EditorSelection | undefined {
  const firstLine = text.split('\n', 1)[0]
  return firstLine === '# ' ? EditorSelection.single(2) : undefined
}

/**
 * Hosts the CodeMirror instance. One view is created for the lifetime of the
 * pane; switching notes swaps the state so undo history never leaks across
 * notes.
 */
export function Editor({ noteId, text, readOnly, viewRef, onTagNavigate }: EditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const noteIdRef = useRef(noteId)
  const extensionsRef = useRef<Extension[] | null>(null)
  const syncingRef = useRef(false)
  const scrollPositions = useRef(new Map<string, number>())
  const readOnlyRef = useRef(readOnly)
  const onTagNavigateRef = useRef(onTagNavigate)
  onTagNavigateRef.current = onTagNavigate

  const updateNoteText = useStore((state) => state.updateNoteText)
  const setFilter = useStore((state) => state.setFilter)

  // Completion reads the store on demand, so the editor never needs rebuilding.
  // The note being edited is excluded: the half-typed `#rec` in front of the
  // cursor is a tag of this note, and suggesting it back is noise.
  const getTags = useMemo(
    () => () => {
      const live = useStore
        .getState()
        .notes.filter((note) => note.trashedAt === null && note.id !== noteIdRef.current)
      return flattenTags(buildTagTree(live)).sort((a, b) => b.count - a.count)
    },
    [],
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const extensions = slateSetup({
      onChange: (value) => {
        if (syncingRef.current) return
        updateNoteText(noteIdRef.current, value)
      },
      onTagClick: (tag) => {
        setFilter({ kind: 'tag', tag })
        onTagNavigateRef.current?.()
      },
      getTags,
      readOnly: readOnlyRef.current,
    })
    extensionsRef.current = extensions

    const view = new EditorView({
      parent: host,
      state: EditorState.create({ doc: text, selection: initialSelection(text), extensions }),
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Created once on mount; note changes are handled by the effects below.
  }, [getTags, setFilter, updateNoteText, viewRef])

  useEffect(() => {
    const view = viewRef.current
    const extensions = extensionsRef.current
    if (!view || !extensions) return

    const switchingNotes = noteIdRef.current !== noteId
    const currentText = view.state.doc.toString()
    if (!switchingNotes && currentText === text) return

    syncingRef.current = true
    try {
      if (switchingNotes) {
        scrollPositions.current.set(noteIdRef.current, view.scrollDOM.scrollTop)
        noteIdRef.current = noteId
        view.setState(EditorState.create({ doc: text, selection: initialSelection(text), extensions }))
        view.dispatch({
          effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
        })
        view.scrollDOM.scrollTop = scrollPositions.current.get(noteId) ?? 0
      } else {
        // An edit from outside the editor: a tag rename, or a todo ticked
        // somewhere else in the app.
        view.dispatch({ changes: { from: 0, to: currentText.length, insert: text } })
      }
    } finally {
      syncingRef.current = false
    }
  }, [noteId, text, readOnly, viewRef])

  useEffect(() => {
    readOnlyRef.current = readOnly
    viewRef.current?.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly, viewRef])

  return <div className="editor-host" ref={hostRef} />
}
