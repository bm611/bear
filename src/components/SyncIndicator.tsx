import { useStore } from '../store/useStore'
import type { SyncStatus } from '../lib/types'

const SYNC_LABEL: Record<SyncStatus, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  error: 'Not saved',
}

/**
 * Whether your writing has reached the server. A failed push used to announce
 * itself only through a toast that cleared after 2.6 seconds, which meant the
 * one piece of state you cannot afford to miss was also the easiest to miss.
 * It sits in the note list's footer, and in the editor's toolbar whenever the
 * list is hidden, so some copy of it is always on screen while you write.
 */
export function SyncIndicator() {
  const status = useStore((state) => state.syncStatus)
  const syncNow = useStore((state) => state.syncNow)

  return (
    <span className="sync-indicator" data-state={status} aria-live="polite">
      <span className="sync-dot" aria-hidden="true" />
      {SYNC_LABEL[status]}
      {status === 'error' ? (
        <button type="button" className="sync-retry" onClick={syncNow}>
          Retry
        </button>
      ) : null}
    </span>
  )
}
