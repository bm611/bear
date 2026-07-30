import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { buildTagTree } from '../lib/tags'
import { matchesFilter } from '../lib/search'
import { mod } from '../lib/platform'
import type { Filter } from '../lib/types'
import { TagTree } from './TagTree'
import { SettingsMenu } from './SettingsMenu'
import {
  ArchiveIcon,
  SlateMark,
  KeyboardIcon,
  NotesIcon,
  PlusIcon,
  SettingsIcon,
  TodayIcon,
  TodoIcon,
  TrashIcon,
  UntaggedIcon,
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

interface LibraryPanelProps {
  /** Pane only — the popover has no footer, and the list header owns settings. */
  onShowShortcuts?: () => void
  /** Pane only. Creates a note and opens the editor (handles the mobile layout). */
  onNewNote?: () => void
  /** Called after picking a filter or tag, so a transient container can close itself. */
  onNavigate?: () => void
  /**
   * `pane` is the pinned sidebar: brand header on top, settings footer below.
   * `popover` is the same navigation dropped from the note list title, where the
   * list header already supplies the title, the new-note button and settings.
   */
  variant?: 'pane' | 'popover'
}

/**
 * Smart filters and the tag tree — everything needed to pick what the note list
 * shows. Rendered either as the pinned sidebar or as the popover behind the note
 * list title, so the two routes stay in step by construction.
 */
export function LibraryPanel({
  onShowShortcuts,
  onNewNote,
  onNavigate,
  variant = 'pane',
}: LibraryPanelProps) {
  const notes = useStore((state) => state.notes)
  const filter = useStore((state) => state.filter)
  const setFilter = useStore((state) => state.setFilter)
  const openTagDialog = useStore((state) => state.openTagDialog)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsTriggerRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Deep in a nested tag the selected row can open below the fold, which matters
  // most for the popover: it is short and gets reopened constantly.
  useEffect(() => {
    scrollRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [])

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

  return (
    <>
      {variant === 'pane' ? (
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
      ) : null}

      <div className="sidebar-scroll scroll-host" ref={scrollRef}>
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
              // The dialogs live at the app root, so dismissing the popover first
              // leaves them standing.
              onRename={(tag) => {
                onNavigate?.()
                openTagDialog({ kind: 'rename', tag })
              }}
              onDelete={(tag) => {
                onNavigate?.()
                openTagDialog({ kind: 'delete', tag })
              }}
            />
          </>
        ) : null}
      </div>

      {variant === 'pane' ? (
        <div className="sidebar-footer menu-anchor">
          <button
            ref={settingsTriggerRef}
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

          {/* Pinned to the foot of the window, so the menu has room upwards. */}
          {settingsOpen ? (
            <SettingsMenu
              triggerRef={settingsTriggerRef}
              onClose={() => setSettingsOpen(false)}
              style={{ bottom: '2.4rem', left: '0.4rem' }}
            />
          ) : null}
        </div>
      ) : null}
    </>
  )
}
