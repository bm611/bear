import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { Sidebar } from './components/Sidebar'
import { NoteList } from './components/NoteList'
import { EditorPane } from './components/EditorPane'
import { ShortcutsSheet } from './components/ShortcutsSheet'
import { Toast } from './components/Toast'
import { AuthScreen } from './components/AuthScreen'
import { useStore } from './store/useStore'
import { useAuthStore } from './store/useAuthStore'
import { useVisibleNotes } from './hooks/useVisibleNotes'
import { NARROW_QUERY, useMediaQuery } from './hooks/useMediaQuery'
import { hasMod } from './lib/platform'

const FONT_STACKS = {
  sans: 'var(--font-ui)',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',
} as const

/** Keeps `data-theme` on the root element in sync with the preference. */
function useTheme() {
  const theme = useStore((state) => state.preferences.theme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'dark' ? '#16171a' : '#ffffff')
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

function useTypography() {
  const font = useStore((state) => state.preferences.font)
  const fontSize = useStore((state) => state.preferences.fontSize)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--editor-font', FONT_STACKS[font])
    root.style.setProperty('--editor-font-size', `${fontSize}px`)
  }, [font, fontSize])
}

/** Loads the signed-in user's notes on sign-in, and clears them on sign-out. */
function useNotesSync() {
  const status = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.session?.user.id ?? null)
  const hydrateNotes = useStore((state) => state.hydrateNotes)
  const resetNotes = useStore((state) => state.resetNotes)
  const notesHydrated = useStore((state) => state.notesHydrated)

  useEffect(() => {
    if (status === 'signedIn' && userId) {
      hydrateNotes(userId)
    } else if (status === 'signedOut') {
      resetNotes()
    }
  }, [status, userId, hydrateNotes, resetNotes])

  return status === 'signedIn' && notesHydrated
}

export function App() {
  useTheme()
  useTypography()

  const authStatus = useAuthStore((state) => state.status)
  const notesReady = useNotesSync()

  if (authStatus !== 'signedIn') return <AuthScreen />
  if (!notesReady) return null

  return <AppShell />
}

function AppShell() {
  const notes = useStore((state) => state.notes)
  const selectedId = useStore((state) => state.selectedId)
  const preferences = useStore((state) => state.preferences)
  const newNote = useStore((state) => state.newNote)
  const selectNote = useStore((state) => state.selectNote)
  const togglePin = useStore((state) => state.togglePin)
  const trashNote = useStore((state) => state.trashNote)
  const setPreferences = useStore((state) => state.setPreferences)
  const showToast = useStore((state) => state.showToast)

  const visible = useVisibleNotes()
  const note = notes.find((candidate) => candidate.id === selectedId) ?? null

  const viewRef = useRef<EditorView | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list')
  const [mobileSidebar, setMobileSidebar] = useState(false)

  // Below the breakpoint the three panes stack: one at a time, sidebar on top.
  const narrow = useMediaQuery(NARROW_QUERY)
  const sidebarOpen = narrow ? mobileSidebar : preferences.sidebarVisible
  const listOpen = narrow ? mobilePane === 'list' : preferences.listVisible
  const editorOpen = narrow ? mobilePane === 'editor' : true

  const openNote = useCallback(() => {
    setMobilePane('editor')
    setMobileSidebar(false)
  }, [])

  const focusEditor = useCallback(() => {
    // Wait for the pane to mount the new document before taking focus.
    requestAnimationFrame(() => viewRef.current?.focus())
  }, [])

  const step = useCallback(
    (delta: number) => {
      if (visible.length === 0) return
      const index = visible.findIndex((candidate) => candidate.id === selectedId)
      const next = index === -1 ? 0 : Math.min(visible.length - 1, Math.max(0, index + delta))
      selectNote(visible[next].id)
    },
    [visible, selectedId, selectNote],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasMod(event) || event.repeat) return
      const target = event.target as HTMLElement | null
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

      switch (event.key.toLowerCase()) {
        case 'n':
          if (event.shiftKey) return
          event.preventDefault()
          newNote()
          openNote()
          focusEditor()
          return
        case 'f':
          event.preventDefault()
          setMobilePane('list')
          setMobileSidebar(false)
          if (!preferences.listVisible) setPreferences({ listVisible: true })
          requestAnimationFrame(() => searchRef.current?.focus())
          return
        case '1':
          if (event.altKey) return
          event.preventDefault()
          if (narrow) setMobileSidebar((open) => !open)
          else setPreferences({ sidebarVisible: !preferences.sidebarVisible })
          return
        case '2':
          if (event.altKey) return
          event.preventDefault()
          if (narrow) setMobilePane((pane) => (pane === 'list' ? 'editor' : 'list'))
          else setPreferences({ listVisible: !preferences.listVisible })
          return
        case '/':
          event.preventDefault()
          setShortcutsOpen((open) => !open)
          return
        case 'p':
          if (!event.shiftKey || !note) return
          event.preventDefault()
          togglePin(note.id)
          return
        case 'backspace':
          if (inField || !note || note.trashedAt !== null) return
          event.preventDefault()
          trashNote(note.id)
          showToast('Moved to trash')
          return
        case 'arrowup':
          if (!event.altKey) return
          event.preventDefault()
          step(-1)
          return
        case 'arrowdown':
          if (!event.altKey) return
          event.preventDefault()
          step(1)
          return
        default:
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [
    focusEditor,
    narrow,
    newNote,
    note,
    openNote,
    preferences.listVisible,
    preferences.sidebarVisible,
    setPreferences,
    showToast,
    step,
    togglePin,
    trashNote,
  ])

  return (
    <div className="app">
      {sidebarOpen ? (
        <Sidebar
          onShowShortcuts={() => setShortcutsOpen(true)}
          onNavigate={() => {
            if (narrow) {
              setMobileSidebar(false)
              setMobilePane('list')
            }
          }}
        />
      ) : null}

      {narrow && sidebarOpen ? (
        <div className="sidebar-scrim" role="presentation" onPointerDown={() => setMobileSidebar(false)} />
      ) : null}

      {listOpen ? (
        <NoteList
          searchRef={searchRef}
          onOpenNote={() => {
            openNote()
            focusEditor()
          }}
          onOpenSidebar={narrow ? () => setMobileSidebar(true) : undefined}
        />
      ) : null}

      {editorOpen ? (
        <EditorPane
          note={note}
          viewRef={viewRef}
          onBack={narrow ? () => setMobilePane('list') : undefined}
        />
      ) : null}

      {shortcutsOpen ? <ShortcutsSheet onClose={() => setShortcutsOpen(false)} /> : null}
      <Toast />
    </div>
  )
}
