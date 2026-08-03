import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorSelection } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { useStore } from '../store/useStore'
import { Editor } from './Editor'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import { ConfirmDialog } from './Dialog'
import {
  ArchiveIcon,
  BoldIcon,
  BulletIcon,
  ChevronRight,
  ClipboardIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  MoreIcon,
  PinIcon,
  QuoteIcon,
  RestoreIcon,
  TableIcon,
  TodoIcon,
  TrashIcon,
} from './Icons'
import {
  NO_FORMATS,
  type ActiveFormats,
  insertCodeBlock,
  insertLink,
  insertTable,
  setHeading,
  toggleBold,
  toggleBulletList,
  toggleItalic,
  toggleQuote,
  toggleTodo,
} from '../editor/commands'
import { useElementWidth } from '../hooks/useElementWidth'
import { fullDate } from '../lib/date'
import { noteTitle } from '../lib/notes'
import { exportNoteHtml, slugify } from '../lib/markdown'
import { copyToClipboard, downloadFile } from '../lib/download'
import { combo, mod, ALT, MOD, SHIFT, BACKSPACE } from '../lib/platform'
import type { Note } from '../lib/types'

interface FormatAction {
  id: string
  label: string
  shortcut: string
  icon: ReactNode
  command: (view: EditorView) => boolean
  /** Which reported format lights this up. Plain inserts have none. */
  state?: keyof Omit<ActiveFormats, 'heading'>
  /**
   * The narrowest toolbar tier that still shows this inline. Anything the tier
   * cannot hold moves into the overflow menu rather than scrolling out of view.
   */
  tier: 1 | 2 | 3
}

/** Ordered by how often the formatting is reached for; tier 3 goes first. */
const FORMAT_ACTIONS: FormatAction[] = [
  {
    id: 'bold',
    label: 'Bold',
    shortcut: mod('B'),
    icon: <BoldIcon />,
    command: toggleBold,
    state: 'bold',
    tier: 1,
  },
  {
    id: 'italic',
    label: 'Italic',
    shortcut: mod('I'),
    icon: <ItalicIcon />,
    command: toggleItalic,
    state: 'italic',
    tier: 1,
  },
  {
    id: 'todo',
    label: 'Todo',
    shortcut: combo(MOD, SHIFT, 'U'),
    icon: <TodoIcon />,
    command: toggleTodo,
    state: 'todo',
    tier: 2,
  },
  {
    id: 'bullet',
    label: 'Bulleted list',
    shortcut: combo(MOD, SHIFT, '8'),
    icon: <BulletIcon />,
    command: toggleBulletList,
    state: 'bullet',
    tier: 2,
  },
  {
    id: 'quote',
    label: 'Quote',
    shortcut: combo(MOD, SHIFT, '.'),
    icon: <QuoteIcon />,
    command: toggleQuote,
    state: 'quote',
    tier: 3,
  },
  {
    id: 'code',
    label: 'Code block',
    shortcut: combo(MOD, SHIFT, 'E'),
    icon: <CodeIcon />,
    command: insertCodeBlock,
    tier: 3,
  },
  {
    id: 'table',
    label: 'Table',
    shortcut: combo(MOD, ALT, 'T'),
    icon: <TableIcon />,
    command: insertTable,
    tier: 3,
  },
  {
    id: 'link',
    label: 'Link',
    shortcut: mod('K'),
    icon: <LinkIcon />,
    command: insertLink,
    tier: 3,
  },
]

/** Toolbar widths below which the formatting controls stop fitting in a row. */
const ROOMY_WIDTH = 620
const MEDIUM_WIDTH = 460

function toolbarTier(width: number): 1 | 2 | 3 {
  if (width > ROOMY_WIDTH) return 3
  if (width > MEDIUM_WIDTH) return 2
  return 1
}

interface EditorPaneProps {
  note: Note | null
  viewRef: React.RefObject<EditorView | null>
  /** Provided only in the stacked layout, where panes replace each other. */
  onBack?: () => void
  /** After clicking a tag pill, e.g. switch back to the note list on mobile. */
  onTagNavigate?: () => void
}

export function EditorPane({ note, viewRef, onBack, onTagNavigate }: EditorPaneProps) {
  const preferences = useStore((state) => state.preferences)
  const setPreferences = useStore((state) => state.setPreferences)
  const togglePin = useStore((state) => state.togglePin)
  const toggleArchive = useStore((state) => state.toggleArchive)
  const trashNote = useStore((state) => state.trashNote)
  const restoreNote = useStore((state) => state.restoreNote)
  const deleteForever = useStore((state) => state.deleteForever)
  const duplicateNote = useStore((state) => state.duplicateNote)
  const showToast = useStore((state) => state.showToast)

  const [menuOpen, setMenuOpen] = useState(false)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formats, setFormats] = useState<ActiveFormats>(NO_FORMATS)

  const toolbarRef = useRef<HTMLDivElement>(null)
  /** Toolbar clicks steal focus; stash the selection so commands still see it. */
  const pendingSelection = useRef<EditorSelection | null>(null)
  const tier = toolbarTier(useElementWidth(toolbarRef))

  const trashed = note?.trashedAt !== null && note !== null
  const readOnly = trashed

  useEffect(() => {
    setHeadingOpen(false)
    setMenuOpen(false)
    setOverflowOpen(false)
    setScrolled(false)
  }, [note?.id])

  // Shade the toolbar's bottom edge once content scrolls beneath it.
  useEffect(() => {
    const scroller = viewRef.current?.scrollDOM as HTMLElement | undefined
    if (!scroller) return
    const onScroll = () => setScrolled(scroller.scrollTop > 4)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [note?.id, viewRef])

  if (!note) {
    return (
      <section className="editor-pane" aria-label="Editor">
        <div className="empty-state">
          <h2>No note selected</h2>
          <p>
            Pick a note from the list, or press <kbd>{mod('N')}</kbd> to write a new one.
          </p>
        </div>
      </section>
    )
  }

  const title = noteTitle(note)
  const inlineActions = FORMAT_ACTIONS.filter((action) => tier >= action.tier)
  const overflowActions = FORMAT_ACTIONS.filter((action) => tier < action.tier)

  const stashSelection = () => {
    const view = viewRef.current
    if (view) pendingSelection.current = view.state.selection
  }

  const run = (command: (view: EditorView) => boolean) => () => {
    const view = viewRef.current
    if (!view || readOnly) return
    const saved = pendingSelection.current
    pendingSelection.current = null
    view.focus()
    if (saved) view.dispatch({ selection: saved })
    command(view)
    view.focus()
  }

  const keepEditorFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    stashSelection()
  }

  const exportMarkdown = () => {
    downloadFile(`${slugify(title)}.md`, note.text, 'text/markdown')
    showToast('Markdown file downloaded')
  }

  const exportHtml = () => {
    downloadFile(`${slugify(title)}.html`, exportNoteHtml(title, note.text), 'text/html')
    showToast('HTML file downloaded')
  }

  const copyMarkdown = async () => {
    const ok = await copyToClipboard(note.text)
    showToast(ok ? 'Markdown copied' : 'Clipboard unavailable')
  }

  // The list carries the note's identity when it is on screen. The header
  // title always shows which note you're editing.
  return (
    <section className="editor-pane" aria-label="Editor">
      <div className="editor-header">
        <div className="editor-header-inner">
          {onBack ? (
            <button
              type="button"
              className="icon-button"
              aria-label="Back to list"
              onClick={onBack}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : null}

          <div className="editor-title-group">
            <span className="editor-eyebrow">Markdown note</span>
            <h1 className="editor-title" title={title}>
              {title}
            </h1>
          </div>

          <div className="editor-header-actions">
            <button
              type="button"
              className="icon-button desktop-only"
              aria-label="Toggle note list"
              aria-pressed={preferences.listVisible}
              title={`Toggle note list (${mod('2')})`}
              onClick={() => setPreferences({ listVisible: !preferences.listVisible })}
            >
              <ListIcon />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              aria-pressed={note.pinned}
              title={`${note.pinned ? 'Unpin' : 'Pin'} (${combo(MOD, SHIFT, 'P')})`}
              onClick={() => togglePin(note.id)}
            >
              <PinIcon />
            </button>

            <div className="menu-anchor">
              <button
                type="button"
                className="icon-button"
                aria-label="Note actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreIcon />
              </button>

              {menuOpen ? (
                <Menu
                  label="Note actions"
                  onClose={() => setMenuOpen(false)}
                  style={{ top: '2.3rem' }}
                >
                  <div className="menu-info">Created {fullDate(note.createdAt)}</div>
                  <MenuSeparator />
                  <MenuItem
                    icon={<CopyIcon size={15} />}
                    onSelect={() => {
                      setMenuOpen(false)
                      duplicateNote(note.id)
                    }}
                  >
                    Duplicate note
                  </MenuItem>
                  <MenuItem
                    icon={<ClipboardIcon size={15} />}
                    onSelect={() => {
                      setMenuOpen(false)
                      void copyMarkdown()
                    }}
                  >
                    Copy as markdown
                  </MenuItem>
                  <MenuSeparator />
                  <MenuLabel>Export</MenuLabel>
                  <MenuItem
                    icon={<DownloadIcon size={15} />}
                    onSelect={() => {
                      setMenuOpen(false)
                      exportMarkdown()
                    }}
                  >
                    Markdown (.md)
                  </MenuItem>
                  <MenuItem
                    icon={<DownloadIcon size={15} />}
                    onSelect={() => {
                      setMenuOpen(false)
                      exportHtml()
                    }}
                  >
                    Web page (.html)
                  </MenuItem>
                  <MenuSeparator />
                  {trashed ? (
                    <>
                      <MenuItem
                        icon={<RestoreIcon size={15} />}
                        onSelect={() => {
                          setMenuOpen(false)
                          restoreNote(note.id)
                        }}
                      >
                        Restore note
                      </MenuItem>
                      <MenuItem
                        danger
                        icon={<TrashIcon size={15} />}
                        onSelect={() => {
                          setMenuOpen(false)
                          setConfirmDelete(true)
                        }}
                      >
                        Delete permanently…
                      </MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem
                        icon={<ArchiveIcon size={15} />}
                        onSelect={() => {
                          setMenuOpen(false)
                          toggleArchive(note.id)
                          showToast(note.archived ? 'Moved out of archive' : 'Moved to archive')
                        }}
                      >
                        {note.archived ? 'Move out of archive' : 'Archive note'}
                      </MenuItem>
                      <MenuItem
                        danger
                        icon={<TrashIcon size={15} />}
                        shortcut={combo(MOD, BACKSPACE)}
                        onSelect={() => {
                          setMenuOpen(false)
                          trashNote(note.id)
                          showToast('Moved to trash')
                        }}
                      >
                        Move to trash
                      </MenuItem>
                    </>
                  )}
                </Menu>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!readOnly ? (
        <div className="editor-toolbar" data-scrolled={scrolled ? 'true' : 'false'}>
          <div className="editor-toolbar-inner" ref={toolbarRef}>
            <div className="toolbar-group" role="group" aria-label="Formatting">
              <div className="menu-anchor">
                <button
                  type="button"
                  className="icon-button toolbar-heading"
                  data-active={formats.heading !== null ? 'true' : undefined}
                  aria-label={
                    formats.heading === null ? 'Heading level' : `Heading level ${formats.heading}`
                  }
                  aria-expanded={headingOpen}
                  title="Heading level"
                  onMouseDown={keepEditorFocus}
                  onClick={() => setHeadingOpen((open) => !open)}
                >
                  <span className="toolbar-heading-level">
                    {formats.heading === null ? 'H' : `H${formats.heading}`}
                  </span>
                  <ChevronRight size={11} className="toolbar-heading-caret" />
                </button>
                {headingOpen ? (
                  <Menu
                    label="Heading level"
                    align="left"
                    restoreFocus={false}
                    onClose={() => setHeadingOpen(false)}
                    style={{ top: '2.3rem' }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <MenuItem
                        key={level}
                        checked={formats.heading === level}
                        shortcut={combo(MOD, '⌥', String(level))}
                        onSelect={() => {
                          setHeadingOpen(false)
                          run(setHeading(level))()
                        }}
                      >
                        Heading {level}
                      </MenuItem>
                    ))}
                  </Menu>
                ) : null}
              </div>

              {inlineActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="icon-button"
                  aria-label={action.label}
                  aria-pressed={action.state ? formats[action.state] : undefined}
                  title={`${action.label} (${action.shortcut})`}
                  onMouseDown={keepEditorFocus}
                  onClick={run(action.command)}
                >
                  {action.icon}
                </button>
              ))}

              {overflowActions.length > 0 ? (
                <div className="menu-anchor">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="More formatting"
                    aria-expanded={overflowOpen}
                    title="More formatting"
                    onMouseDown={keepEditorFocus}
                    onClick={() => setOverflowOpen((open) => !open)}
                  >
                    <MoreIcon />
                  </button>
                  {overflowOpen ? (
                    <Menu
                      label="More formatting"
                      align="right"
                      restoreFocus={false}
                      onClose={() => setOverflowOpen(false)}
                      style={{ top: '2.3rem' }}
                    >
                      {overflowActions.map((action) => (
                        <MenuItem
                          key={action.id}
                          icon={action.icon}
                          checked={action.state ? formats[action.state] : undefined}
                          shortcut={action.shortcut}
                          onSelect={() => {
                            setOverflowOpen(false)
                            run(action.command)()
                          }}
                        >
                          {action.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="editor-canvas">
        {trashed ? (
          <div className="banner" role="status">
            This note is in the trash.
            <span className="banner-actions">
              <button type="button" onClick={() => restoreNote(note.id)}>
                Put back
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)}>
                Delete now
              </button>
            </span>
          </div>
        ) : note.archived ? (
          <div className="banner" role="status">
            Archived.
            <span className="banner-actions">
              <button type="button" onClick={() => toggleArchive(note.id)}>
                Move out of archive
              </button>
            </span>
          </div>
        ) : null}

        <Editor
          noteId={note.id}
          text={note.text}
          readOnly={readOnly}
          viewRef={viewRef}
          onTagNavigate={onTagNavigate}
          onFormatsChange={setFormats}
        />
      </div>

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete this note?"
          description={`“${title}” will be deleted permanently. This cannot be undone.`}
          confirmLabel="Delete permanently"
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteForever(note.id)
            setConfirmDelete(false)
          }}
        />
      ) : null}
    </section>
  )
}
