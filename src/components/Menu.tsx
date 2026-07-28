import { useEffect, useRef, type ReactNode } from 'react'

interface MenuProps {
  onClose: () => void
  align?: 'left' | 'right'
  style?: React.CSSProperties
  label: string
  children: ReactNode
}

function menuItems(root: HTMLElement | null): HTMLButtonElement[] {
  if (!root) return []
  return [...root.querySelectorAll<HTMLButtonElement>('.menu-item:not([disabled])')]
}

/** A lightweight popover: closes on outside click, Escape or scroll-away. */
export function Menu({ onClose, align = 'right', style, label, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        onClose()
        return
      }

      const items = menuItems(ref.current)
      if (items.length === 0) return
      const index = items.indexOf(document.activeElement as HTMLButtonElement)

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const next = index < 0 ? 0 : (index + 1) % items.length
        items[next].focus()
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length
        items[next].focus()
        return
      }
      if (event.key === 'Home') {
        event.preventDefault()
        items[0].focus()
        return
      }
      if (event.key === 'End') {
        event.preventDefault()
        items[items.length - 1].focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    menuItems(ref.current)[0]?.focus()
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
