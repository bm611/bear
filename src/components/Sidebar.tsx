import { LibraryPanel } from './LibraryPanel'

interface SidebarProps {
  onShowShortcuts: () => void
  /** Creates a note and opens the editor (handles the stacked mobile layout). */
  onNewNote: () => void
  /** Called after picking a filter or tag, so a narrow layout can close itself. */
  onNavigate?: () => void
}

/**
 * The library as a pinned pane, toggled with the sidebar shortcut. When it is not
 * pinned the note list title drops the very same panel as a popover instead.
 */
export function Sidebar(props: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Library">
      <LibraryPanel {...props} variant="pane" />
    </aside>
  )
}
