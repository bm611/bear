import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface ScrimProps {
  onClose: () => void
  children: ReactNode
  label: string
}

export function Scrim({ onClose, children, label }: ScrimProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div
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
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={destructive ? 'button button-danger' : 'button button-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Scrim>
  )
}
