import { useRef } from 'react'
import { useStore } from '../store/useStore'
import { exportLibrary, parseLibraryFile } from '../lib/storage'
import { downloadFile } from '../lib/download'
import { supabase } from '../lib/supabaseClient'
import { mod } from '../lib/platform'
import type { ListDensity, PreviewLines, ThemeMode } from '../lib/types'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu'
import { DownloadIcon, KeyboardIcon, MoonIcon, SunIcon, UploadIcon } from './Icons'

const THEMES: Array<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match system' },
]

const DENSITIES: Array<{ value: ListDensity; label: string }> = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
]

const PREVIEWS: Array<{ value: PreviewLines; label: string }> = [
  { value: 2, label: 'Two lines' },
  { value: 1, label: 'One line' },
  { value: 0, label: 'Title only' },
]

interface SettingsMenuProps {
  onClose: () => void
  align?: 'left' | 'right'
  direction?: 'down' | 'up'
  style?: React.CSSProperties
  /** Adds a shortcuts entry, for the surfaces that have no room for its own button. */
  onShowShortcuts?: () => void
  /** The button that opened the menu, so pressing it again closes rather than reopens. */
  triggerRef?: React.RefObject<HTMLElement | null>
}

/**
 * Theme, editor type, backup and sign-out. Tall enough that it has to open where
 * there is room, so its placement is left to whoever anchors it.
 */
export function SettingsMenu({
  onClose,
  align = 'left',
  direction,
  style,
  onShowShortcuts,
  triggerRef,
}: SettingsMenuProps) {
  const notes = useStore((state) => state.notes)
  const preferences = useStore((state) => state.preferences)
  const setPreferences = useStore((state) => state.setPreferences)
  const importNotes = useStore((state) => state.importNotes)
  const showToast = useStore((state) => state.showToast)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const added = importNotes(parseLibraryFile(text))
      showToast(`Imported ${added} note${added === 1 ? '' : 's'}`)
    } catch {
      showToast('That file could not be imported')
    }
  }

  return (
    <Menu
      align={align}
      direction={direction}
      label="Settings"
      onClose={onClose}
      style={style}
      triggerRef={triggerRef}
    >
      <MenuLabel>Theme</MenuLabel>
      {THEMES.map(({ value, label }) => (
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
        Google Sans
      </MenuItem>
      <MenuItem checked={preferences.font === 'inter'} onSelect={() => setPreferences({ font: 'inter' })}>
        Inter
      </MenuItem>
      <MenuItem checked={preferences.font === 'system'} onSelect={() => setPreferences({ font: 'system' })}>
        System
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
      <MenuLabel>Note list</MenuLabel>
      {DENSITIES.map(({ value, label }) => (
        <MenuItem
          key={value}
          checked={preferences.density === value}
          onSelect={() => setPreferences({ density: value })}
        >
          {label}
        </MenuItem>
      ))}
      <MenuLabel>Preview</MenuLabel>
      {PREVIEWS.map(({ value, label }) => (
        <MenuItem
          key={value}
          checked={preferences.previewLines === value}
          onSelect={() => setPreferences({ previewLines: value })}
        >
          {label}
        </MenuItem>
      ))}

      <MenuSeparator />
      <MenuLabel>Library</MenuLabel>
      <MenuItem
        icon={<DownloadIcon size={15} />}
        onSelect={() => {
          onClose()
          downloadFile('slate-notes.json', exportLibrary(notes), 'application/json')
          showToast('Backup downloaded')
        }}
      >
        Export backup…
      </MenuItem>
      {/* The menu stays open behind the file picker on purpose: closing it would
          unmount the input before the browser reports the chosen file. */}
      <MenuItem icon={<UploadIcon size={15} />} onSelect={() => fileRef.current?.click()}>
        Import backup…
      </MenuItem>

      {onShowShortcuts ? (
        <>
          <MenuSeparator />
          <MenuItem
            icon={<KeyboardIcon size={15} />}
            shortcut={mod('/')}
            onSelect={() => {
              onClose()
              onShowShortcuts()
            }}
          >
            Keyboard shortcuts
          </MenuItem>
        </>
      ) : null}

      <MenuSeparator />
      <MenuItem
        onSelect={() => {
          onClose()
          void supabase.auth.signOut()
        }}
      >
        Sign out
      </MenuItem>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          void handleImport(file)
          onClose()
        }}
      />
    </Menu>
  )
}
