import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useVisibleNotes } from '../hooks/useVisibleNotes'
import { noteTitle, notePreview, todoStats, UNTITLED } from '../lib/notes'
import { listDate } from '../lib/date'
import { mod } from '../lib/platform'
import type { Filter, Note, SortMode, SyncStatus } from '../lib/types'
import { ConfirmDialog } from './Dialog'
import { LibraryPanel } from './LibraryPanel'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import { Popover } from './Popover'
import { SettingsMenu } from './SettingsMenu'
import {
  ChevronDown,
  CloseIcon,
  MoreIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SlateMark,
  TodoIcon,
  TrashIcon,
} from './Icons'

function filterTitle(filter: Filter): string {
  switch (filter.kind) {
    case 'all':
      return 'Notes'
    case 'untagged':
      return 'Untagged'
    case 'todo':
      return 'Todo'
    case 'today':
      return 'Today'
    case 'archive':
      return 'Archive'
    case 'trash':
      return 'Trash'
    case 'tag':
      return `#${filter.tag}`
  }
}

interface NoteListProps {
  searchRef: React.RefObject<HTMLInputElement | null>
  onOpenNote?: () => void
  onShowShortcuts?: () => void
}

export function NoteList({ searchRef, onOpenNote, onShowShortcuts }: NoteListProps) {
  const filter = useStore((state) => state.filter)
  const notes = useStore((state) => state.notes)
  const query = useStore((state) => state.query)
  const selectedId = useStore((state) => state.selectedId)
  const sort = useStore((state) => state.preferences.sort)
  const density = useStore((state) => state.preferences.density)
  const previewLines = useStore((state) => state.preferences.previewLines)
  const setQuery = useStore((state) => state.setQuery)
  const selectNote = useStore((state) => state.selectNote)
  const newNote = useStore((state) => state.newNote)
  const setPreferences = useStore((state) => state.setPreferences)
  const emptyTrash = useStore((state) => state.emptyTrash)

  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const libraryTriggerRef = useRef<HTMLButtonElement>(null)
  const settingsTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  const visible = useVisibleNotes()
  const liveCount = useMemo(
    () => notes.filter((note) => note.trashedAt === null && !note.archived).length,
    [notes],
  )

  // Keep the selected card in view when selection moves by keyboard.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, filter])

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'modified', label: 'Date modified' },
    { value: 'created', label: 'Date created' },
    { value: 'title', label: 'Title' },
  ]

  const title = filterTitle(filter)

  const createNote = () => {
    newNote()
    onOpenNote?.()
  }

  return (
    <section
      className="note-list"
      aria-label={`${title} notes`}
      data-density={density}
      style={{ '--preview-lines': previewLines } as React.CSSProperties}
    >
      <div className="list-header">
        <div className="list-brand-row">
          <span className="list-brand">
            <SlateMark size={20} />
            Slate
          </span>
          <div className="list-brand-actions">
            <button
              type="button"
              className="icon-button"
              title={`New note (${mod('N')})`}
              aria-label="New note"
              onClick={createNote}
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <div className="list-title-row">
          <div className="list-title-group">
            <h1 className="list-title">
              <button
                ref={libraryTriggerRef}
                type="button"
                className="list-title-trigger"
                aria-label={`${title} — browse library`}
                aria-expanded={libraryOpen}
                title={title}
                onClick={() => setLibraryOpen((open) => !open)}
              >
                <span className="list-title-text">{title}</span>
                <ChevronDown size={14} />
              </button>
            </h1>
          </div>

          <div className="list-title-actions menu-anchor">
            <button
              ref={settingsTriggerRef}
              type="button"
              className="icon-button"
              aria-label="Settings"
              aria-expanded={settingsOpen}
              title="Settings"
              onClick={() => {
                setMenuOpen(false)
                setSettingsOpen((open) => !open)
              }}
            >
              <SettingsIcon />
            </button>
            {settingsOpen ? (
              <SettingsMenu
                style={{ top: '2rem' }}
                align="right"
                triggerRef={settingsTriggerRef}
                onClose={() => setSettingsOpen(false)}
                onShowShortcuts={onShowShortcuts}
              />
            ) : null}
            <button
              ref={menuTriggerRef}
              type="button"
              className="icon-button"
              aria-label="List options"
              aria-expanded={menuOpen}
              onClick={() => {
                setSettingsOpen(false)
                setMenuOpen((open) => !open)
              }}
            >
              <MoreIcon />
            </button>

            {menuOpen ? (
              <Menu
                label="List options"
                triggerRef={menuTriggerRef}
                onClose={() => setMenuOpen(false)}
                style={{ top: '2rem' }}
              >
                <MenuLabel>Sort by</MenuLabel>
                {sortOptions.map(({ value, label }) => (
                  <MenuItem
                    key={value}
                    checked={sort === value}
                    onSelect={() => setPreferences({ sort: value })}
                  >
                    {label}
                  </MenuItem>
                ))}
                {filter.kind === 'trash' ? (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      danger
                      icon={<TrashIcon size={15} />}
                      disabled={visible.length === 0}
                      onSelect={() => {
                        setMenuOpen(false)
                        setConfirmEmpty(true)
                      }}
                    >
                      Empty trash…
                    </MenuItem>
                  </>
                ) : null}
              </Menu>
            ) : null}
          </div>
        </div>

        <div className="search-field">
          <SearchIcon size={14} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search"
            aria-label="Search notes"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                if (query) setQuery('')
                else event.currentTarget.blur()
              }
              if (event.key === 'ArrowDown' && visible.length > 0) {
                event.preventDefault()
                selectNote(visible[0].id)
                listRef.current?.querySelector<HTMLElement>('.note-card')?.focus()
              }
            }}
          />
          {query ? (
            <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}>
              <CloseIcon size={13} />
            </button>
          ) : null}
        </div>

        {/* Anchored to the header rather than to the title that opens it, so it
            drops clear of the search field instead of over it. */}
        {libraryOpen ? (
          <Popover
            className="library-popover"
            label="Library"
            triggerRef={libraryTriggerRef}
            onClose={() => setLibraryOpen(false)}
          >
            <LibraryPanel onNavigate={() => setLibraryOpen(false)} />
          </Popover>
        ) : null}
      </div>

      <div className="list-scroll scroll-host" ref={listRef}>
        {visible.length === 0 ? (
          <div className="empty-state">
            <h2>{query ? 'No matches' : 'Nothing here yet'}</h2>
            <p>
              {query
                ? 'Try a different word, or search a #tag.'
                : filter.kind === 'trash'
                  ? 'Deleted notes will collect here.'
                  : `Press ${mod('N')} to start a new note.`}
            </p>
          </div>
        ) : (
          visible.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onSelect={() => {
                selectNote(note.id)
                onOpenNote?.()
              }}
            />
          ))
        )}
      </div>

      <div className="list-footer">
        <span className="list-footer-count">
          {liveCount} note{liveCount === 1 ? '' : 's'}
        </span>
        <SyncIndicator />
      </div>

      {confirmEmpty ? (
        <ConfirmDialog
          title="Empty trash?"
          description={`${visible.length} note${visible.length === 1 ? '' : 's'} will be deleted permanently. This cannot be undone.`}
          confirmLabel="Delete permanently"
          destructive
          onCancel={() => setConfirmEmpty(false)}
          onConfirm={() => {
            emptyTrash()
            setConfirmEmpty(false)
          }}
        />
      ) : null}
    </section>
  )
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  error: 'Not saved',
}

/**
 * Whether your writing has reached the server. A failed push used to announce
 * itself only through a toast that cleared after 2.6 seconds, which meant the
 * one piece of state you cannot afford to miss was also the easiest to miss.
 */
function SyncIndicator() {
  const status = useStore((state) => state.syncStatus)
  const syncNow = useStore((state) => state.syncNow)

  return (
    <span className="list-footer-sync" data-state={status} aria-live="polite">
      <span className="sync-dot" aria-hidden="true" />
      {SYNC_LABEL[status]}
      {status === 'error' ? (
        <button type="button" className="sync-retry" onClick={syncNow}>
          Retry
        </button>
      ) : null}
    </span>
  )
}

interface NoteCardProps {
  note: Note
  selected: boolean
  onSelect: () => void
}

function NoteCard({ note, selected, onSelect }: NoteCardProps) {
  const previewLines = useStore((state) => state.preferences.previewLines)
  const title = noteTitle(note)
  // At zero the preview is dropped rather than clamped: a clamped-to-nothing
  // box still carries its top margin, which would leave a strip of empty space
  // where the preview used to be.
  const preview = previewLines === 0 ? '' : notePreview(note)
  const todos = todoStats(note.text)

  return (
    <button
      type="button"
      className="note-card"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      data-note-id={note.id}
    >
      <span className="note-card-top">
        <span className="note-card-title" style={title === UNTITLED ? { opacity: 0.55 } : undefined}>
          {title}
        </span>
        {note.pinned ? (
          <span className="note-card-icon" title="Pinned">
            <PinIcon size={13} />
          </span>
        ) : null}
        <span className="note-card-date">{listDate(note.updatedAt)}</span>
      </span>

      {preview ? <span className="note-card-preview">{preview}</span> : null}

      {todos.total > 0 ? (
        <span className="note-card-meta">
          <TodoIcon size={12} />
          {todos.done}/{todos.total}
        </span>
      ) : null}
    </button>
  )
}
