import { useEffect, useRef, type ReactNode } from 'react'

interface PopoverProps {
  onClose: () => void
  label: string
  className?: string
  /**
   * The control that opened the popover. Given one, a press on it is left alone
   * so its own handler can toggle: closing here as well would reopen on the click
   * that follows, and the popover would never dismiss.
   */
  triggerRef?: React.RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * A panel that closes on outside click or Escape. Unlike `Menu` it makes no
 * assumptions about its contents — no menu roles, no arrow-key walk — so it can
 * host something as involved as the library, nested menus and all.
 */
export function Popover({ onClose, label, className, triggerRef, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target) || triggerRef?.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // A menu opened inside us gets the first refusal, so Escape peels one
      // layer at a time instead of dismissing the lot.
      if (ref.current?.querySelector('.menu')) return
      event.stopPropagation()
      event.preventDefault()
      onClose()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused.current?.focus?.()
    }
  }, [onClose, triggerRef])

  // Land on whatever is currently selected, falling back to the first control.
  // Focusing scrolls that row into view, so keyboard entry and the scroll
  // position agree rather than fighting each other.
  useEffect(() => {
    const root = ref.current
    const target =
      root?.querySelector<HTMLElement>('[aria-current="true"]') ??
      root?.querySelector<HTMLElement>('button:not([disabled])')
    target?.focus()
  }, [])

  return (
    <div className={className} role="dialog" aria-label={label} ref={ref}>
      {children}
    </div>
  )
}
