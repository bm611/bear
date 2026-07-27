import { useEffect, useState } from 'react'
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
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  MoreIcon,
  PinIcon,
  QuoteIcon,
  RestoreIcon,
  SidebarIcon,
  TableIcon,
  TodoIcon,
  TrashIcon,
} from './Icons'
import {
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
import { noteTitle } from '../lib/notes'
import { exportNoteHtml, slugify } from '../lib/markdown'
import { copyToClipboard, downloadFile } from '../lib/download'
import { combo, mod, ALT, MOD, SHIFT, BACKSPACE } from '../lib/platform'
import type { Note } from '../lib/types'

interface EditorPaneProps {
  note: Note | null
  viewRef: React.RefObject<EditorView | null>
  /** Provided only in the stacked layout, where panes replace each other. */
  onBack?: () => void
}

export function EditorPane({ note, viewRef, onBack }: EditorPaneProps) {
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const trashed = note?.trashedAt !== null && note !== null
  const readOnly = trashed

  useEffect(() => {
    setHeadingOpen(false)
    setMenuOpen(false)
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

  const run = (command: (view: EditorView) => boolean) => () => {
    const view = viewRef.current
    if (!view || readOnly) return
    command(view)
    view.focus()
  }

  const keepEditorFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
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

  return (
    <section className="editor-pane" aria-label="Editor">
      <div className="editor-toolbar" data-scrolled={scrolled ? 'true' : 'false'}>
        {onBack ? (
          <button type="button" className="icon-button" aria-label="Back to list" onClick={onBack}>
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        ) : null}

        <button
          type="button"
          className="icon-button desktop-only"
          aria-label="Toggle sidebar"
          aria-pressed={preferences.sidebarVisible}
          title={`Toggle sidebar (${mod('1')})`}
          onClick={() => setPreferences({ sidebarVisible: !preferences.sidebarVisible })}
        >
          <SidebarIcon />
        </button>
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

        {!readOnly ? (
          <>
            <span className="toolbar-divider" />
            <div className="menu-anchor">
              <button
                type="button"
                className="icon-button"
                aria-label="Heading level"
                aria-expanded={headingOpen}
                title="Heading level"
                onClick={() => setHeadingOpen((open) => !open)}
              >
                <HeadingIcon />
              </button>
              {headingOpen ? (
                <Menu
                  label="Heading level"
                  align="left"
                  onClose={() => setHeadingOpen(false)}
                  style={{ top: '2.1rem' }}
                >
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <MenuItem
                      key={level}
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
            <button
              type="button"
              className="icon-button"
              aria-label="Bold"
              title={`Bold (${mod('B')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(toggleBold)}
            >
              <BoldIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Italic"
              title={`Italic (${mod('I')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(toggleItalic)}
            >
              <ItalicIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Todo"
              title={`Todo (${combo(MOD, SHIFT, 'U')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(toggleTodo)}
            >
              <TodoIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Bulleted list"
              title={`Bulleted list (${combo(MOD, SHIFT, '8')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(toggleBulletList)}
            >
              <BulletIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Quote"
              title={`Quote (${combo(MOD, SHIFT, '.')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(toggleQuote)}
            >
              <QuoteIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Code block"
              title={`Code block (${combo(MOD, SHIFT, 'E')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(insertCodeBlock)}
            >
              <CodeIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Table"
              title={`Table (${combo(MOD, ALT, 'T')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(insertTable)}
            >
              <TableIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Link"
              title={`Link (${mod('K')})`}
              onMouseDown={keepEditorFocus}
              onClick={run(insertLink)}
            >
              <LinkIcon />
            </button>
          </>
        ) : null}

        <span className="toolbar-spacer" />
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
            <Menu label="Note actions" onClose={() => setMenuOpen(false)} style={{ top: '2.1rem' }}>
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

      <Editor noteId={note.id} text={note.text} readOnly={readOnly} viewRef={viewRef} />

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
