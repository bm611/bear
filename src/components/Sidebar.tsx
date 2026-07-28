import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { buildTagTree } from '../lib/tags'
import { matchesFilter } from '../lib/search'
import { exportLibrary, parseLibraryFile } from '../lib/storage'
import { downloadFile } from '../lib/download'
import { supabase } from '../lib/supabaseClient'
import { mod } from '../lib/platform'
import type { Filter, ThemeMode } from '../lib/types'
import { TagTree } from './TagTree'
import { ConfirmDialog, PromptDialog } from './Dialog'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import {
  ArchiveIcon,
  SlateMark,
  DownloadIcon,
  KeyboardIcon,
  MoonIcon,
  NotesIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  TodayIcon,
  TodoIcon,
  TrashIcon,
  UntaggedIcon,
  UploadIcon,
} from './Icons'

const SMART_FILTERS: Array<{ filter: Filter; label: string; icon: ReactNode }> = [
  { filter: { kind: 'all' }, label: 'Notes', icon: <NotesIcon size={15} /> },
  { filter: { kind: 'todo' }, label: 'Todo', icon: <TodoIcon size={15} /> },
  { filter: { kind: 'today' }, label: 'Today', icon: <TodayIcon size={15} /> },
  { filter: { kind: 'untagged' }, label: 'Untagged', icon: <UntaggedIcon size={15} /> },
  { filter: { kind: 'archive' }, label: 'Archive', icon: <ArchiveIcon size={15} /> },
  { filter: { kind: 'trash' }, label: 'Trash', icon: <TrashIcon size={15} /> },
]

function sameFilter(a: Filter, b: Filter): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'tag' && b.kind === 'tag') return a.tag.toLowerCase() === b.tag.toLowerCase()
  return true
}

interface SidebarProps {
  onShowShortcuts: () => void
  /** Creates a note and opens the editor (handles the stacked mobile layout). */
  onNewNote: () => void
  /** Called after picking a filter or tag, so a narrow layout can close itself. */
  onNavigate?: () => void
}

export function Sidebar({ onShowShortcuts, onNewNote, onNavigate }: SidebarProps) {
  const notes = useStore((state) => state.notes)
  const filter = useStore((state) => state.filter)
  const preferences = useStore((state) => state.preferences)
  const setFilter = useStore((state) => state.setFilter)
  const renameTag = useStore((state) => state.renameTag)
  const deleteTag = useStore((state) => state.deleteTag)
  const setPreferences = useStore((state) => state.setPreferences)
  const importNotes = useStore((state) => state.importNotes)
  const showToast = useStore((state) => state.showToast)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const liveNotes = useMemo(() => notes.filter((note) => note.trashedAt === null && !note.archived), [notes])
  const tagTree = useMemo(() => buildTagTree(liveNotes), [liveNotes])

  const counts = useMemo(() => {
    const now = Date.now()
    const result = new Map<string, number>()
    for (const { filter: smart } of SMART_FILTERS) {
      result.set(smart.kind, notes.filter((note) => matchesFilter(note, smart, now)).length)
    }
    return result
  }, [notes])

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const added = importNotes(parseLibraryFile(text))
      showToast(`Imported ${added} note${added === 1 ? '' : 's'}`)
    } catch {
      showToast('That file could not be imported')
    }
  }

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Match system' },
  ]

  return (
    <aside className="sidebar" aria-label="Library">
      <div className="sidebar-header">
        <span className="sidebar-brand">
          <SlateMark size={20} />
          Slate
        </span>
        <div className="sidebar-header-actions">
          <button
            type="button"
            className="icon-button"
            title={`New note (${mod('N')})`}
            aria-label="New note"
            onClick={onNewNote}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div className="sidebar-scroll scroll-host">
        {SMART_FILTERS.map(({ filter: smart, label, icon }) => {
          const count = counts.get(smart.kind) ?? 0
          if (count === 0 && (smart.kind === 'archive' || smart.kind === 'trash')) return null
          return (
            <div className="tag-row-wrapper" key={smart.kind}>
              <span className="disclosure" aria-hidden="true" />
              <button
                type="button"
                className="sidebar-row"
                aria-current={sameFilter(filter, smart) ? 'true' : undefined}
                onClick={() => {
                  setFilter(smart)
                  onNavigate?.()
                }}
              >
                <span className="sidebar-row-icon">{icon}</span>
                <span className="sidebar-row-label">{label}</span>
                <span className="count-badge">{count}</span>
              </button>
            </div>
          )
        })}

        {tagTree.length > 0 ? (
          <>
            <div className="sidebar-section-label">Tags</div>
            <TagTree
              nodes={tagTree}
              filter={filter}
              onSelect={(tag) => {
                setFilter({ kind: 'tag', tag })
                onNavigate?.()
              }}
              onRename={setRenaming}
              onDelete={setDeleting}
            />
          </>
        ) : null}
      </div>

      <div className="sidebar-footer menu-anchor">
        <button
          type="button"
          className="icon-button"
          aria-label="Settings"
          aria-expanded={settingsOpen}
          title="Settings"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <SettingsIcon />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Keyboard shortcuts"
          title={`Keyboard shortcuts (${mod('/')})`}
          onClick={onShowShortcuts}
        >
          <KeyboardIcon />
        </button>
        <span className="sidebar-footer-count">
          {liveNotes.length} note{liveNotes.length === 1 ? '' : 's'}
        </span>

        {settingsOpen ? (
          <Menu
            align="left"
            label="Settings"
            onClose={() => setSettingsOpen(false)}
            style={{ bottom: '2.4rem', left: '0.4rem' }}
          >
            <MenuLabel>Theme</MenuLabel>
            {themeOptions.map(({ value, label }) => (
              <MenuItem
                key={value}
                checked={preferences.theme === value}
                icon={value === 'dark' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
                onSelect={() => setPreferences({ theme: value })}
              >
                {label}
              </MenuItem>
            ))}

            <MenuSeparator />
            <MenuLabel>Editor font</MenuLabel>
            <MenuItem checked={preferences.font === 'sans'} onSelect={() => setPreferences({ font: 'sans' })}>
              Sans
            </MenuItem>
            <MenuItem checked={preferences.font === 'serif'} onSelect={() => setPreferences({ font: 'serif' })}>
              Serif
            </MenuItem>
            <MenuItem checked={preferences.font === 'mono'} onSelect={() => setPreferences({ font: 'mono' })}>
              Mono
            </MenuItem>

            <div className="stepper">
              <button
                type="button"
                aria-label="Smaller text"
                onClick={() => setPreferences({ fontSize: Math.max(13, preferences.fontSize - 1) })}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Larger text"
                onClick={() => setPreferences({ fontSize: Math.min(24, preferences.fontSize + 1) })}
              >
                +
              </button>
              <span>{preferences.fontSize}px</span>
            </div>

            <MenuSeparator />
            <MenuLabel>Library</MenuLabel>
            <MenuItem
              icon={<DownloadIcon size={15} />}
              onSelect={() => {
                setSettingsOpen(false)
                downloadFile('slate-notes.json', exportLibrary(notes), 'application/json')
                showToast('Backup downloaded')
              }}
            >
              Export backup…
            </MenuItem>
            <MenuItem
              icon={<UploadIcon size={15} />}
              onSelect={() => {
                setSettingsOpen(false)
                fileRef.current?.click()
              }}
            >
              Import backup…
            </MenuItem>

            <MenuSeparator />
            <MenuItem
              onSelect={() => {
                setSettingsOpen(false)
                void supabase.auth.signOut()
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleImport(file)
            event.target.value = ''
          }}
        />
      </div>

      {renaming !== null ? (
        <PromptDialog
          title="Rename tag"
          description={`Every note using #${renaming} — and any tag nested inside it — will be updated.`}
          initialValue={renaming}
          confirmLabel="Rename"
          onCancel={() => setRenaming(null)}
          onConfirm={(value) => {
            renameTag(renaming, value)
            setRenaming(null)
          }}
        />
      ) : null}

      {deleting !== null ? (
        <ConfirmDialog
          title={`Remove #${deleting}?`}
          description="The hashtag is deleted from every note that uses it. The notes themselves are kept."
          confirmLabel="Remove tag"
          destructive
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteTag(deleting)
            setDeleting(null)
          }}
        />
      ) : null}
    </aside>
  )
}
