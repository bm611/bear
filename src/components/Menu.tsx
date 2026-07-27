import { useEffect, useRef, type ReactNode } from 'react'

interface MenuProps {
  onClose: () => void
  align?: 'left' | 'right'
  style?: React.CSSProperties
  label: string
  children: ReactNode
}

/** A lightweight popover: closes on outside click, Escape or scroll-away. */
export function Menu({ onClose, align = 'right', style, label, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onClose])

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('.menu-item')?.focus()
  }, [])

  return (
    <div className="menu" data-align={align} style={style} role="menu" aria-label={label} ref={ref}>
      {children}
    </div>
  )
}

interface MenuItemProps {
  onSelect: () => void
  children: ReactNode
  shortcut?: string
  danger?: boolean
  checked?: boolean
  icon?: ReactNode
  disabled?: boolean
}

export function MenuItem({
  onSelect,
  children,
  shortcut,
  danger,
  checked,
  icon,
  disabled,
}: MenuItemProps) {
  return (
    <button
      type="button"
      className="menu-item"
      role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
      aria-checked={checked}
      data-danger={danger === true ? 'true' : undefined}
      disabled={disabled}
      onClick={onSelect}
    >
      {icon}
      <span>{children}</span>
      {shortcut ? <span className="menu-shortcut">{shortcut}</span> : null}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="menu-separator" role="separator" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="menu-label">{children}</div>
}
