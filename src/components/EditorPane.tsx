import { useEffect, useMemo, useRef, useState } from 'react'
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
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  MoreIcon,
  PencilIcon,
  PinIcon,
  QuoteIcon,
  RestoreIcon,
  SidebarIcon,
  EyeIcon,
  TodoIcon,
  TrashIcon,
} from './Icons'
import {
  insertLink,
  setHeading,
  toggleBold,
  toggleBulletList,
  toggleInlineCode,
  toggleItalic,
  toggleQuote,
  toggleTodo,
} from '../editor/commands'
import { characterCount, noteTags, noteTitle, readingTime, todoStats, wordCount } from '../lib/notes'
import { exportNoteHtml, renderMarkdown, slugify } from '../lib/markdown'
import { copyToClipboard, downloadFile } from '../lib/download'
import { fullDate, relativeDate } from '../lib/date'
import { combo, hasMod, mod, MOD, SHIFT, BACKSPACE } from '../lib/platform'
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
  const [previewing, setPreviewing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const trashed = note?.trashedAt !== null && note !== null
  const readOnly = trashed

  useEffect(() => {
    setPreviewing(false)
    setScrolled(false)
  }, [note?.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasMod(event) || !event.shiftKey || event.key.toLowerCase() !== 'v') return
      event.preventDefault()
      setPreviewing((value) => !value)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  // Shade the toolbar's bottom edge once content scrolls beneath it.
  useEffect(() => {
    const scroller = previewing
      ? previewRef.current
      : (viewRef.current?.scrollDOM as HTMLElement | undefined)
    if (!scroller) return
    const onScroll = () => setScrolled(scroller.scrollTop > 4)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [previewing, note?.id, viewRef])

  const html = useMemo(
    () => (previewing && note ? renderMarkdown(note.text) : ''),
    [previewing, note],
  )

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
  const tags = noteTags(note)
  const todos = todoStats(note.text)
  const words = wordCount(note.text)

  const run = (command: (view: EditorView) => boolean) => () => {
    const view = viewRef.current
    if (!view || readOnly) return
    command(view)
    view.focus()
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

        {!previewing && !readOnly ? (
          <>
            <span className="toolbar-divider" />
            <button
              type="button"
              className="icon-button"
              aria-label="Heading"
              title={`Heading (${combo(MOD, '⌥', '1')})`}
              onClick={run(setHeading(2))}
            >
              <HeadingIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Bold"
              title={`Bold (${mod('B')})`}
              onClick={run(toggleBold)}
            >
              <BoldIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Italic"
              title={`Italic (${mod('I')})`}
              onClick={run(toggleItalic)}
            >
              <ItalicIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Todo"
              title={`Todo (${combo(MOD, SHIFT, 'U')})`}
              onClick={run(toggleTodo)}
            >
              <TodoIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Bulleted list"
              title={`Bulleted list (${combo(MOD, SHIFT, '8')})`}
              onClick={run(toggleBulletList)}
            >
              <BulletIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Quote"
              title={`Quote (${combo(MOD, SHIFT, '.')})`}
              onClick={run(toggleQuote)}
            >
              <QuoteIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Code"
              title={`Code (${mod('E')})`}
              onClick={run(toggleInlineCode)}
            >
              <CodeIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Link"
              title={`Link (${mod('K')})`}
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
          aria-label={previewing ? 'Back to editing' : 'Preview'}
          aria-pressed={previewing}
          title={`${previewing ? 'Edit' : 'Preview'} (${combo(MOD, SHIFT, 'V')})`}
          onClick={() => setPreviewing((value) => !value)}
        >
          {previewing ? <PencilIcon /> : <EyeIcon />}
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
                icon={<CopyIcon size={15} />}
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

      {previewing ? (
        <div className="preview scroll-host" ref={previewRef}>
          {/* Sanitised by DOMPurify in renderMarkdown. */}
          <div className="preview-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        <Editor noteId={note.id} text={note.text} readOnly={readOnly} viewRef={viewRef} />
      )}

      <div className="editor-footer">
        <span title={`Created ${fullDate(note.createdAt)}`}>Edited {relativeDate(note.updatedAt)}</span>
        <span>
          {words} word{words === 1 ? '' : 's'}
        </span>
        <span className="desktop-only">{characterCount(note.text)} characters</span>
        <span className="desktop-only">{readingTime(note.text)} min read</span>
        {todos.total > 0 ? (
          <span>
            {todos.done}/{todos.total} done
          </span>
        ) : null}
        {tags.length > 0 ? (
          <span className="editor-footer-tags">
            {tags.map((tag) => (
              <span className="note-chip" key={tag}>
                #{tag}
              </span>
            ))}
          </span>
        ) : null}
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
