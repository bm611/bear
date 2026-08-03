import { useRef, useState } from 'react'
import { LibraryPanel } from './LibraryPanel'
import { SettingsMenu } from './SettingsMenu'
import { KeyboardIcon, PlusIcon, SettingsIcon, SidebarIcon, SlateMark } from './Icons'
import { mod } from '../lib/platform'

interface SidebarProps {
  /** Presented as an overlay drawer (narrow layouts) rather than a fixed pane. */
  drawer?: boolean
  /** Collapses the pane on desktop; closes the drawer on narrow layouts. */
  onHide: () => void
  /** Called after picking a filter or tag, so a drawer can close itself. */
  onNavigate?: () => void
  onNewNote: () => void
  onShowShortcuts: () => void
}

/**
 * The library, pinned: smart filters and the tag tree, with the brand above
 * and settings below. On desktop it is a fixed pane toggled with ⌘1; under
 * the compact breakpoint it slides over the list as a drawer instead.
 */
export function Sidebar({ drawer, onHide, onNavigate, onNewNote, onShowShortcuts }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsTriggerRef = useRef<HTMLButtonElement>(null)

  return (
    <nav className="sidebar" data-drawer={drawer ? 'true' : undefined} aria-label="Library">
      <div className="sidebar-header">
        <span className="sidebar-brand">
          <SlateMark size={17} />
          Slate
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Hide sidebar"
          title={drawer ? 'Close library' : `Hide sidebar (${mod('1')})`}
          onClick={onHide}
        >
          <SidebarIcon />
        </button>
      </div>

      <button type="button" className="sidebar-new" onClick={onNewNote}>
        <PlusIcon size={15} />
        New note
        <kbd>{mod('N')}</kbd>
      </button>

      <LibraryPanel onNavigate={onNavigate} />

      <div className="sidebar-footer">
        <div className="menu-anchor">
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
          {settingsOpen ? (
            <SettingsMenu
              align="left"
              direction="up"
              triggerRef={settingsTriggerRef}
              onClose={() => setSettingsOpen(false)}
            />
          ) : null}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Keyboard shortcuts"
          title={`Keyboard shortcuts (${mod('/')})`}
          onClick={onShowShortcuts}
        >
          <KeyboardIcon />
        </button>
      </div>
    </nav>
  )
}
