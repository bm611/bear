import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useVisibleNotes } from '../hooks/useVisibleNotes'
import { noteTitle, notePreview, todoStats, UNTITLED } from '../lib/notes'
import { filterTitle } from '../lib/filters'
import { listDate } from '../lib/date'
import { mod } from '../lib/platform'
import type { Note, SortMode } from '../lib/types'
import { ConfirmDialog } from './Dialog'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import { SyncIndicator } from './SyncIndicator'
import {
  CloseIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SidebarIcon,
  SortIcon,
  TodoIcon,
  TrashIcon,
} from './Icons'

interface NoteListProps {
  searchRef: React.RefObject<HTMLInputElement | null>
  onOpenNote?: () => void
  /** Reopens the library — the drawer on narrow layouts, the pane on desktop.
      Present only while the sidebar is off screen. */
  onOpenLibrary?: () => void
}

export function NoteList({ searchRef, onOpenNote, onOpenLibrary }: NoteListProps) {
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
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
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
        <div className="list-bar">
          {onOpenLibrary ? (
            <button
              type="button"
              className="icon-button"
              aria-label="Open library"
              title={`Open library (${mod('1')})`}
              onClick={onOpenLibrary}
            >
              <SidebarIcon />
            </button>
          ) : null}

          <h1 className="list-title">
            <span className="list-title-text">{title}</span>
            <span className="count-badge">{visible.length}</span>
          </h1>

          <div className="list-bar-actions menu-anchor">
            <button
              type="button"
              className="icon-button"
              title={`New note (${mod('N')})`}
              aria-label="New note"
              onClick={createNote}
            >
              <PlusIcon />
            </button>
            <button
              ref={menuTriggerRef}
              type="button"
              className="icon-button"
              aria-label="Sort and list options"
              aria-expanded={menuOpen}
              title="Sort and list options"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <SortIcon />
            </button>

            {menuOpen ? (
              <Menu label="List options" triggerRef={menuTriggerRef} onClose={() => setMenuOpen(false)}>
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
            placeholder="Search notes"
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
