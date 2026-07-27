import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useVisibleNotes } from '../hooks/useVisibleNotes'
import { noteTags, noteTitle, notePreview, todoStats, UNTITLED } from '../lib/notes'
import { listDate } from '../lib/date'
import { mod } from '../lib/platform'
import type { Filter, Note, SortMode } from '../lib/types'
import { ConfirmDialog } from './Dialog'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import { CloseIcon, MenuIcon, MoreIcon, PinIcon, PlusIcon, SearchIcon, TodoIcon, TrashIcon } from './Icons'

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
  /** Provided only in the stacked layout, where the sidebar slides over. */
  onOpenSidebar?: () => void
}

export function NoteList({ searchRef, onOpenNote, onOpenSidebar }: NoteListProps) {
  const filter = useStore((state) => state.filter)
  const query = useStore((state) => state.query)
  const selectedId = useStore((state) => state.selectedId)
  const sort = useStore((state) => state.preferences.sort)
  const setQuery = useStore((state) => state.setQuery)
  const selectNote = useStore((state) => state.selectNote)
  const newNote = useStore((state) => state.newNote)
  const setPreferences = useStore((state) => state.setPreferences)
  const emptyTrash = useStore((state) => state.emptyTrash)

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const visible = useVisibleNotes()

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

  return (
    <section className="note-list" aria-label={`${title} notes`}>
      <div className="list-header">
        <div className="list-title-row">
          {onOpenSidebar ? (
            <button type="button" className="icon-button" aria-label="Show library" onClick={onOpenSidebar}>
              <MenuIcon />
            </button>
          ) : null}
          <h1 className="list-title" title={title}>
            {title}
          </h1>
          <div className="list-title-actions menu-anchor">
            <button
              type="button"
              className="icon-button"
              aria-label="List options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              title={`New note (${mod('N')})`}
              aria-label="New note"
              onClick={() => {
                newNote()
                onOpenNote?.()
              }}
            >
              <PlusIcon />
            </button>

            {menuOpen ? (
              <Menu label="List options" onClose={() => setMenuOpen(false)} style={{ top: '2rem' }}>
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
  const title = noteTitle(note)
  const preview = notePreview(note)
  const tags = noteTags(note)
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

      {tags.length > 0 || todos.total > 0 ? (
        <span className="note-card-meta">
          {todos.total > 0 ? (
            <>
              <TodoIcon size={12} />
              {todos.done}/{todos.total}
            </>
          ) : null}
          {tags.slice(0, 3).map((tag) => (
            <span className="note-chip" key={tag}>
              #{tag}
            </span>
          ))}
          {tags.length > 3 ? <span>+{tags.length - 3}</span> : null}
        </span>
      ) : null}
    </button>
  )
}
