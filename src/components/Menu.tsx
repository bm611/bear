import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Breathing room kept between a menu and the window edge. */
const VIEWPORT_MARGIN = 8

interface MenuProps {
  onClose: () => void
  align?: 'left' | 'right'
  style?: React.CSSProperties
  label: string
  /**
   * Whether closing hands focus back to whatever opened the menu. Turn it off
   * when the chosen item puts the caret somewhere better, such as the editor.
   */
  restoreFocus?: boolean
  children: ReactNode
}

function menuItems(root: HTMLElement | null): HTMLButtonElement[] {
  if (!root) return []
  return [...root.querySelectorAll<HTMLButtonElement>('.menu-item:not([disabled])')]
}

/** A lightweight popover: closes on outside click, Escape or scroll-away. */
export function Menu({
  onClose,
  align = 'right',
  style,
  label,
  restoreFocus = true,
  children,
}: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const restoreFocusRef = useRef(restoreFocus)
  restoreFocusRef.current = restoreFocus
  const [left, setLeft] = useState<number | null>(null)

  /**
   * `align` only says which way the menu prefers to open. A button sitting
   * near a window edge — the formatting overflow on a phone, say — would still
   * hang off it, so the menu measures itself once and slides back into view.
   * Corrected through `left` rather than a transform, which the open animation
   * would override for its first frames.
   */
  useLayoutEffect(() => {
    const menu = ref.current
    const anchor = menu?.offsetParent
    if (!menu || !anchor) return

    const rect = menu.getBoundingClientRect()
    let shift = 0
    const overflowRight = rect.right + VIEWPORT_MARGIN - window.innerWidth
    if (overflowRight > 0) shift = -overflowRight
    if (rect.left + shift < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - rect.left
    if (shift === 0) return

    setLeft(rect.left + shift - anchor.getBoundingClientRect().left)
  }, [])

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
      if (restoreFocusRef.current) previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    menuItems(ref.current)[0]?.focus()
  }, [])

  return (
    <div
      className="menu"
      data-align={align}
      style={left === null ? style : { ...style, left, right: 'auto' }}
      role="menu"
      aria-label={label}
      ref={ref}
    >
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
