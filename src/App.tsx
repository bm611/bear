import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { NoteList } from './components/NoteList'
import { EditorPane } from './components/EditorPane'
import { Sidebar } from './components/Sidebar'
import { ShortcutsSheet } from './components/ShortcutsSheet'
import { TagDialogs } from './components/TagDialogs'
import { Toast } from './components/Toast'
import { AuthScreen, type AuthMode } from './components/AuthScreen'
import { LandingScreen } from './components/LandingScreen'
import { SlateMark } from './components/Icons'
import { useStore } from './store/useStore'
import { useAuthStore } from './store/useAuthStore'
import { useVisibleNotes } from './hooks/useVisibleNotes'
import { COMPACT_QUERY, NARROW_QUERY, useMediaQuery } from './hooks/useMediaQuery'
import { hasMod } from './lib/platform'

const FONT_STACKS = {
  sans: 'var(--font-ui)',
  inter: 'var(--font-inter)',
  system: 'var(--font-system)',
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
        ?.setAttribute('content', resolved === 'dark' ? '#101020' : '#ecedf4')
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
  const notesError = useStore((state) => state.notesError)

  useEffect(() => {
    if (status === 'signedIn' && userId) {
      void hydrateNotes(userId)
    } else if (status === 'signedOut') {
      resetNotes()
    }
  }, [status, userId, hydrateNotes, resetNotes])

  return {
    ready: status === 'signedIn' && notesHydrated,
    error: status === 'signedIn' ? notesError : null,
    retry: () => {
      if (userId) void hydrateNotes(userId)
    },
  }
}

function BootScreen({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <span className="boot-mark">
        <SlateMark size={28} />
      </span>
      <h1>{title}</h1>
      {body ? <p>{body}</p> : null}
      {action ? (
        <button type="button" className="button button-primary" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

export function App() {
  useTheme()
  useTypography()

  const authStatus = useAuthStore((state) => state.status)
  const { ready: notesReady, error: notesError, retry } = useNotesSync()
  const [entry, setEntry] = useState<'landing' | 'auth'>('landing')
  const [authMode, setAuthMode] = useState<AuthMode>('signUp')

  if (authStatus === 'loading') {
    return <BootScreen title="Wiping the slate…" />
  }

  if (authStatus !== 'signedIn') {
    if (entry === 'landing') {
      return (
        <LandingScreen
          onLaunch={(mode) => {
            setAuthMode(mode)
            setEntry('auth')
          }}
        />
      )
    }
    return (
      <AuthScreen key={authMode} initialMode={authMode} onBack={() => setEntry('landing')} />
    )
  }

  if (notesError) {
    return (
      <BootScreen
        title="Couldn't load your notes"
        body={notesError}
        action={{ label: 'Try again', onClick: retry }}
      />
    )
  }

  if (!notesReady) {
    return <BootScreen title="Fetching your notes…" />
  }

  return <AppShell />
}

export function AppShell() {
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
  /** Transient by design: the drawer never survives a navigation or a resize up. */
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Below the breakpoint the two panes stack: one at a time.
  const narrow = useMediaQuery(NARROW_QUERY)
  // Between the breakpoints the sidebar overlays the list instead of sitting
  // beside it, so a mid-sized window still gets a full-width list and editor.
  const compact = useMediaQuery(COMPACT_QUERY)
  const listOpen = narrow ? mobilePane === 'list' : preferences.listVisible
  const editorOpen = narrow ? mobilePane === 'editor' : true
  const sidebarOpen = compact ? drawerOpen : preferences.sidebarVisible

  const openNote = useCallback(() => {
    setMobilePane('editor')
  }, [])

  const showList = useCallback(() => {
    setMobilePane('list')
  }, [])

  const toggleSidebar = useCallback(() => {
    if (compact) setDrawerOpen((open) => !open)
    else setPreferences({ sidebarVisible: !preferences.sidebarVisible })
  }, [compact, preferences.sidebarVisible, setPreferences])

  const focusEditor = useCallback(() => {
    // Wait for the pane to mount the new document before taking focus.
    requestAnimationFrame(() => viewRef.current?.focus())
  }, [])

  const createNote = useCallback(() => {
    newNote()
    openNote()
    focusEditor()
  }, [focusEditor, newNote, openNote])

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
          createNote()
          return
        case '1':
          if (event.altKey) return
          event.preventDefault()
          toggleSidebar()
          return
        case 'f':
          event.preventDefault()
          setMobilePane('list')
          if (!preferences.listVisible) setPreferences({ listVisible: true })
          requestAnimationFrame(() => searchRef.current?.focus())
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
    createNote,
    narrow,
    note,
    preferences.listVisible,
    setPreferences,
    showToast,
    step,
    toggleSidebar,
    togglePin,
    trashNote,
  ])

  return (
    <div className="app">
      {compact && drawerOpen ? (
        <div className="drawer-scrim" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
      ) : null}

      {sidebarOpen ? (
        <Sidebar
          drawer={compact}
          onHide={toggleSidebar}
          onNavigate={compact ? () => setDrawerOpen(false) : undefined}
          onNewNote={() => {
            if (compact) setDrawerOpen(false)
            createNote()
          }}
          onShowShortcuts={() => {
            if (compact) setDrawerOpen(false)
            setShortcutsOpen(true)
          }}
        />
      ) : null}

      {listOpen ? (
        <NoteList
          searchRef={searchRef}
          onOpenNote={() => {
            openNote()
            focusEditor()
          }}
          onOpenLibrary={sidebarOpen && !compact ? undefined : toggleSidebar}
        />
      ) : null}

      {editorOpen ? (
        <EditorPane
          note={note}
          viewRef={viewRef}
          onBack={narrow ? () => setMobilePane('list') : undefined}
          onTagNavigate={narrow ? showList : undefined}
        />
      ) : null}

      {shortcutsOpen ? <ShortcutsSheet onClose={() => setShortcutsOpen(false)} /> : null}
      <TagDialogs />
      <Toast />
    </div>
  )
}
