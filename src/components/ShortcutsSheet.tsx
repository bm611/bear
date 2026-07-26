import { Scrim } from './Dialog'
import { CloseIcon } from './Icons'
import { ALT, BACKSPACE, MOD, SHIFT, combo, mod } from '../lib/platform'

const GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: 'Library',
    rows: [
      ['New note', mod('N')],
      ['Search', mod('F')],
      ['Previous note', combo(MOD, ALT, '↑')],
      ['Next note', combo(MOD, ALT, '↓')],
      ['Toggle sidebar', mod('1')],
      ['Toggle note list', mod('2')],
      ['Pin / unpin', combo(MOD, SHIFT, 'P')],
      ['Move to trash', combo(MOD, BACKSPACE)],
      ['Preview', combo(MOD, SHIFT, 'V')],
      ['This list', mod('/')],
    ],
  },
  {
    title: 'Formatting',
    rows: [
      ['Bold', mod('B')],
      ['Italic', mod('I')],
      ['Strikethrough', combo(MOD, SHIFT, 'X')],
      ['Highlight', combo(MOD, SHIFT, 'H')],
      ['Inline code', mod('E')],
      ['Code block', combo(MOD, SHIFT, 'E')],
      ['Link', mod('K')],
      ['Todo', combo(MOD, SHIFT, 'U')],
      ['Bulleted list', combo(MOD, SHIFT, '8')],
      ['Numbered list', combo(MOD, SHIFT, '7')],
      ['Quote', combo(MOD, SHIFT, '.')],
      ['Divider', combo(MOD, SHIFT, '-')],
      ['Heading 1 – 6', combo(MOD, ALT, '1…6')],
      ['Indent / outdent', `Tab / ${combo(SHIFT, 'Tab')}`],
    ],
  },
]

export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Scrim onClose={onClose} label="Keyboard shortcuts">
      <div className="sheet">
        <div className="sheet-header">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="shortcut-grid">
          {GROUPS.map((group) => (
            <div className="shortcut-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.rows.map(([label, keys]) => (
                <div className="shortcut-row" key={label}>
                  <span>{label}</span>
                  <kbd>{keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Scrim>
  )
}
