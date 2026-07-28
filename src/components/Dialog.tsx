import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ScrimProps {
  onClose: () => void
  children: ReactNode
  label: string
}

export function Scrim({ onClose, children, label }: ScrimProps) {
  const scrimRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const root = scrimRef.current
    const focusables = () => [...(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]

    // Prefer an autofocus target, otherwise the first focusable control.
    const initial =
      root?.querySelector<HTMLElement>('[data-autofocus="true"]') ?? focusables()[0] ?? null
    initial?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !root) return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  return (
    <div
      ref={scrimRef}
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

interface PromptDialogProps {
  title: string
  description?: string
  initialValue?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({
  title,
  description,
  initialValue = '',
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  return (
    <Scrim onClose={onCancel} label={title}>
      <form
        className="sheet dialog"
        onSubmit={(event) => {
          event.preventDefault()
          if (value.trim()) onConfirm(value.trim())
        }}
      >
        <div className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        {description ? <p className="dialog-text">{description}</p> : null}
        <input
          ref={inputRef}
          className="dialog-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label={title}
          data-autofocus="true"
        />
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Scrim>
  )
}

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Scrim onClose={onCancel} label={title}>
      <div className="sheet dialog">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        <p className="dialog-text">{description}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="button"
            onClick={onCancel}
            data-autofocus={destructive ? 'true' : undefined}
          >
            Cancel
          </button>
          <button
            type="button"
            className={destructive ? 'button button-danger' : 'button button-primary'}
            onClick={onConfirm}
            data-autofocus={destructive ? undefined : 'true'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Scrim>
  )
}
